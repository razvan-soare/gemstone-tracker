import { supabase } from "@/config/supabase";
import { CreateGemstoneInputType } from "@/hooks/useCreateGemstone";
import { useCreateOrganization } from "@/hooks/useCreateOrganization";
import { useOrganizationMemberships } from "@/hooks/useOrganizationMemberships";
import type { Tables } from "@/lib/database.types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { SplashScreen, useRouter, useSegments } from "expo-router";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import "../lib/supabase-types"; // Import type extensions
SplashScreen.preventAutoHideAsync();

// Storage key for the active organization
const ACTIVE_ORGANIZATION_KEY = "gemstone_tracker_active_organization";

interface ProfileType {
	id: string;
	name: string;
	created_at: string | null;
	updated_at: string | null;
	is_onboarded: boolean;
}

interface CompleteOnboardingParams {
	user_name: string;
	organization_name: string;
}

type SupabaseContextProps = {
	user: User | null;
	session: Session | null;
	initialized?: boolean;
	signUp: (email: string, password: string) => Promise<void>;
	signInWithPassword: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
	createGemstone: (
		gemstone: CreateGemstoneInputType,
	) => Promise<Tables<"stones">>;
	activeOrganization: Tables<"organizations"> | null;
	userOrganizations: Tables<"organizations">[];
	onSelectOrganization: (organizationId: string) => Promise<void>;
	createOrganizationForUser: (
		userId: string,
		email: string,
	) => Promise<Tables<"organizations"> | null>;
	updateActiveOrganization: (organization: Tables<"organizations">) => void;
	userProfile: ProfileType | null;
	isOnboarded: boolean;
	completeUserOnboarding: (props: {
		userName: string;
		organizationName: string;
		organizationId: string;
	}) => Promise<void>;
};

type SupabaseProviderProps = {
	children: React.ReactNode;
};

export const SupabaseContext = createContext<SupabaseContextProps>({
	user: null,
	session: null,
	initialized: false,
	signUp: async () => {},
	signInWithPassword: async () => {},
	signOut: async () => {},
	createGemstone: async () => new Promise((resolve) => resolve({} as any)),
	activeOrganization: null,
	userOrganizations: [],
	onSelectOrganization: async () => {},
	createOrganizationForUser: async () => null,
	updateActiveOrganization: () => {},
	userProfile: null,
	isOnboarded: false,
	completeUserOnboarding: async () => {},
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
	const router = useRouter();
	const segments = useSegments();
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [initialized, setInitialized] = useState<boolean>(false);
	const [userProfile, setUserProfile] = useState<ProfileType | null>(null);
	const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
	const queryClient = useQueryClient();
	const { data: organizationMemberships } = useOrganizationMemberships(session);
	const [activeOrganization, setActiveOrganization] =
		useState<Tables<"organizations"> | null>(null);
	const createOrganization = useCreateOrganization();

	// Derive userOrganizations from organizationMemberships
	const userOrganizations = useMemo(() => {
		if (!organizationMemberships?.length) return [];
		return organizationMemberships
			.map((membership) => membership.organization)
			.filter((org) => org !== null);
	}, [organizationMemberships]);

	// Fetch user profile when user changes
	useEffect(() => {
		const fetchUserProfile = async () => {
			if (!user) {
				setUserProfile(null);
				setIsOnboarded(false);
				return;
			}

			try {
				const { data, error } = await supabase
					.from("profiles")
					.select("*")
					.eq("id", user.id)
					.single();

				if (error) {
					setUserProfile(null);
					setIsOnboarded(false);
					return;
				}

				setUserProfile(data as ProfileType);
				setIsOnboarded(data?.is_onboarded || false);
			} catch (error) {
				console.error("Error in fetchUserProfile:", error);
				setUserProfile(null);
				setIsOnboarded(false);
			}
		};

		fetchUserProfile();
	}, [user]);

	// Load the active organization from AsyncStorage on initialization
	useEffect(() => {
		const loadActiveOrganization = async () => {
			try {
				const storedOrgId = await AsyncStorage.getItem(ACTIVE_ORGANIZATION_KEY);

				if (storedOrgId && organizationMemberships?.length) {
					const storedOrg = organizationMemberships.find(
						(m) => m.organization_id === storedOrgId,
					);

					if (storedOrg) {
						setActiveOrganization(storedOrg.organization);
						return;
					}
				}

				// If no stored organization or it's not found, use default logic
				if (organizationMemberships?.length && !activeOrganization) {
					const ownerMembership = organizationMemberships.find(
						(m) => m.role === "owner",
					);

					if (ownerMembership) {
						setActiveOrganization(ownerMembership.organization);
					}
				}
			} catch (error) {
				console.error("Error loading active organization:", error);
			}
		};

		loadActiveOrganization();
	}, [organizationMemberships]);

	const onSelectOrganization = async (organizationId: string) => {
		const membership = organizationMemberships?.find(
			(m) => m.organization_id === organizationId,
		);

		if (!membership || !membership.organization) return;

		setActiveOrganization(membership.organization);
		try {
			await AsyncStorage.setItem(ACTIVE_ORGANIZATION_KEY, organizationId);
		} catch (error) {
			console.error("Error saving active organization:", error);
		}
		queryClient.invalidateQueries({ queryKey: ["gemstone"] });
		queryClient.invalidateQueries({ queryKey: ["gemstones"] });
	};

	const signUp = async (email: string, password: string) => {
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: process.env.EXPO_PUBLIC_REDIRECT_URL,
			},
		});
		if (error) {
			throw error;
		}
	};

	const signInWithPassword = async (email: string, password: string) => {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			throw error;
		}
		// If login successful, check if user has an organization and create one if not
		if (data.user) {
			await createOrganizationForUser(data.user.id, data.user.email || "");
		}
	};

	const signOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			throw error;
		}
	};

	const createGemstone = async (gemstone: CreateGemstoneInputType) => {
		const { data, error } = await supabase
			.from("stones")
			.insert(gemstone)
			.select()
			.single();

		if (error) {
			throw error;
		}

		return data;
	};

	// Function to complete the onboarding process
	const completeUserOnboarding = async (props: {
		userName: string;
		organizationName: string;
		organizationId: string;
	}) => {
		if (!user) throw new Error("User not authenticated");
		let organizationId = props.organizationId;
		try {
			// 1. Update user profile with name and mark as onboarded
			const { error: profileError } = await supabase.from("profiles").upsert({
				id: user.id,
				name: props.userName,
				is_onboarded: true,
				updated_at: new Date().toISOString(),
			});

			if (profileError) {
				console.error("Error updating profile:", profileError);
				throw profileError;
			}

			if (organizationId) {
				// Update the existing organization name
				const { data: updatedOrg, error: updateOrgError } = await supabase
					.from("organizations")
					.update({
						name: props.organizationName,
						updated_at: new Date().toISOString(),
					})
					.eq("id", organizationId)
					.select()
					.single();

				if (updateOrgError) {
					console.error("Error updating organization:", updateOrgError);
					throw updateOrgError;
				}

				if (!updatedOrg) {
					throw new Error("Failed to update organization");
				}

				// Create owner record if it doesn't exist
				const { error: createOwnerError } = await supabase
					.from("organization_owners")
					.insert({
						organization_id: organizationId,
						name: props.userName,
					});

				if (createOwnerError) {
					console.error("Error creating organization owner:", createOwnerError);
					throw createOwnerError;
				}
			} else {
				// User doesn't have an organization, create a new one
				const organization = await createOrganization.mutateAsync({
					name: props.organizationName,
					userId: user.id,
				});

				if (!organization) {
					throw new Error("Failed to create organization");
				}

				organizationId = organization.id;

				// Create organization owner with the user's name
				const { error: ownerError } = await supabase
					.from("organization_owners")
					.insert({
						organization_id: organizationId,
						name: props.userName,
					});

				if (ownerError) {
					console.error("Error creating organization owner:", ownerError);
					throw ownerError;
				}
			}

			// Update local state with the results
			setIsOnboarded(true);
			setUserProfile({
				id: user.id,
				name: props.userName,
				is_onboarded: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			});

			// Update async storage for active organization
			try {
				await AsyncStorage.setItem(ACTIVE_ORGANIZATION_KEY, organizationId);
			} catch (error) {
				console.error("Error saving active organization:", error);
			}

			// Invalidate relevant queries
			queryClient.invalidateQueries({ queryKey: ["organization_members"] });
			queryClient.invalidateQueries({
				queryKey: ["organization-gemstone-types"],
			});
		} catch (error) {
			console.error("Error in completeUserOnboarding:", error);
			throw error;
		}
	};

	// Function to create an organization for a user
	const createOrganizationForUser = async (
		userId: string,
		email: string,
	): Promise<Tables<"organizations"> | null> => {
		try {
			// Check if user already has an organization
			const { data: existingMemberships, error: membershipError } =
				await supabase
					.from("organization_members")
					.select("organization_id")
					.eq("user_id", userId);

			if (membershipError) {
				console.error("Error checking existing memberships:", membershipError);
				return null;
			}

			// If user already has organizations, don't create a new one
			if (existingMemberships && existingMemberships.length > 0) {
				return null;
			}

			// Create a new organization with a name based on the user's email
			const orgName = email
				? `${email.split("@")[0]}'s Organization`
				: "My Organization";

			const organization = await createOrganization.mutateAsync({
				name: orgName,
				userId: userId,
			});

			return organization;
		} catch (error) {
			console.error("Error in createOrganizationForUser:", error);
			return null;
		}
	};

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session ? session.user : null);
			setInitialized(true);
		});

		supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setUser(session ? session.user : null);
		});
	}, []);

	useEffect(() => {
		if (!initialized) return;

		const inProtectedGroup = segments[1] === "(protected)";
		const isOnboardingScreen = segments.some(
			(segment) => segment && segment.includes("onboarding"),
		);
		const isVerifyPage = segments.some(
			(segment) => segment && segment.includes("verify"),
		);

		if (session) {
			// If user is authenticated but not onboarded and not on onboarding screen
			if (!isOnboarded && !isOnboardingScreen) {
				router.replace("/(app)/onboarding");
			}
			// If user is authenticated and onboarded but not in protected group
			else if (isOnboarded && !inProtectedGroup && !isVerifyPage) {
				router.replace("/(app)/(protected)");
			}
		} else if (!session && inProtectedGroup) {
			// If not authenticated but trying to access protected routes
			router.replace("/(app)/welcome");
		}

		/* HACK: Something must be rendered when determining the initial auth state... 
		instead of creating a loading screen, we use the SplashScreen and hide it after
		a small delay (500 ms)
		*/

		setTimeout(() => {
			SplashScreen.hideAsync();
		}, 500);
	}, [initialized, session, isOnboarded]);

	const updateActiveOrganization = (organization: Tables<"organizations">) => {
		setActiveOrganization(organization);
		try {
			AsyncStorage.setItem(ACTIVE_ORGANIZATION_KEY, organization.id).catch(
				(error) => console.error("Error saving active organization:", error),
			);
		} catch (error) {
			console.error("Error saving active organization:", error);
		}
		queryClient.invalidateQueries({ queryKey: ["gemstone"] });
		queryClient.invalidateQueries({ queryKey: ["gemstones"] });
	};

	return (
		<SupabaseContext.Provider
			value={{
				user,
				session,
				initialized,
				signUp,
				signInWithPassword,
				signOut,
				createGemstone,
				activeOrganization,
				userOrganizations,
				onSelectOrganization,
				createOrganizationForUser,
				updateActiveOrganization,
				userProfile,
				isOnboarded,
				completeUserOnboarding,
			}}
		>
			{children}
		</SupabaseContext.Provider>
	);
};
