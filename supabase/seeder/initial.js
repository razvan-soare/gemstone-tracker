#!/usr/bin/env node

/**
 * Supabase Seeder Script
 *
 * This script creates a test user, organization, and stone in the Supabase database.
 * It uses the Supabase JavaScript client to interact with the database.
 *
 * Usage:
 * 1. Make sure you have the Supabase URL and anon key in your .env file
 * 2. Run: node scripts/seed.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test user credentials
const TEST_USER = {
	email: "test@test.com",
	password: "flarflar",
	name: "Test User",
};

// Test organization
const TEST_ORGANIZATION = {
	name: "Test Organization",
};

// Test stone
const TEST_STONE = {
	name: "Test Diamond",
	weight: 2.5,
	color: "Clear",
	shape: "Round",
	gem_type: "Diamond",
	buy_price: 1000.0,
	buy_currency: "USD",
	sold: false,
	comment: "This is a test stone created by the seeder script",
};

async function seed() {
	console.log("Starting seeder script...");

	try {
		// Step 1: Sign up or sign in the test user
		let user;

		// Try to sign in first
		const { data: signInData, error: signInError } =
			await supabase.auth.signInWithPassword({
				email: TEST_USER.email,
				password: TEST_USER.password,
			});

		if (signInError) {
			console.log("User does not exist, creating new user...");

			// User doesn't exist, create a new one
			const { data: signUpData, error: signUpError } =
				await supabase.auth.signUp({
					email: TEST_USER.email,
					password: TEST_USER.password,
					options: {
						data: {
							name: TEST_USER.name,
						},
					},
				});

			if (signUpError) {
				throw new Error(`Error creating user: ${signUpError.message}`);
			}

			user = signUpData.user;
			console.log(`Created new user: ${user.id}`);
		} else {
			user = signInData.user;
			console.log(`Signed in as existing user: ${user.id}`);
		}

		// Step 2: Check if the user already has an organization
		const { data: existingOrgs, error: orgsError } = await supabase
			.from("organizations")
			.select("*")
			.eq("user_id", user.id);

		if (orgsError) {
			throw new Error(`Error checking organizations: ${orgsError.message}`);
		}

		let organizationId;

		if (existingOrgs && existingOrgs.length > 0) {
			organizationId = existingOrgs[0].id;
			console.log(`User already has organization: ${organizationId}`);
		} else {
			// Create a new organization
			const { data: newOrg, error: createOrgError } = await supabase
				.from("organizations")
				.insert({
					name: TEST_ORGANIZATION.name,
					user_id: user.id,
				})
				.select()
				.single();

			if (createOrgError) {
				throw new Error(
					`Error creating organization: ${createOrgError.message}`,
				);
			}

			organizationId = newOrg.id;
			console.log(`Created new organization: ${organizationId}`);

			// Add user as organization member with owner role
			const { error: memberError } = await supabase
				.from("organization_members")
				.insert({
					organization_id: organizationId,
					user_id: user.id,
					role: "owner",
				});

			if (memberError) {
				throw new Error(
					`Error adding user as organization member: ${memberError.message}`,
				);
			}

			console.log(`Added user as organization owner`);
		}

		// Step 3: Check if the organization already has stones
		const { data: existingStones, error: stonesError } = await supabase
			.from("stones")
			.select("*")
			.eq("organization_id", organizationId)
			.limit(1);

		if (stonesError) {
			throw new Error(`Error checking stones: ${stonesError.message}`);
		}

		if (existingStones && existingStones.length > 0) {
			console.log(`Organization already has stones`);
		} else {
			// Add a stone to the organization
			const { data: newStone, error: createStoneError } = await supabase
				.from("stones")
				.insert({
					organization_id: organizationId,
					...TEST_STONE,
				})
				.select()
				.single();

			if (createStoneError) {
				throw new Error(`Error creating stone: ${createStoneError.message}`);
			}

			console.log(`Created new stone: ${newStone.id}`);
		}

		console.log("Seeding completed successfully!");
		console.log("----------------------------------------");
		console.log("You can now log in with:");
		console.log(`Email: ${TEST_USER.email}`);
		console.log(`Password: ${TEST_USER.password}`);
		console.log("----------------------------------------");
	} catch (error) {
		console.error("Error in seeder script:", error.message);
		process.exit(1);
	}
}

// Run the seeder
seed();
