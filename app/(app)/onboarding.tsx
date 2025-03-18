import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Alert, View } from "react-native";
import * as z from "zod";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormInput } from "@/components/ui/form";
import { Text } from "@/components/ui/text";
import { H1, P } from "@/components/ui/typography";
import { useSupabase } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";

const formSchema = z.object({
	userName: z
		.string()
		.min(2, "Name must be at least 2 characters.")
		.max(50, "Name must be less than 50 characters."),
	organizationName: z
		.string()
		.min(2, "Organization name must be at least 2 characters.")
		.max(50, "Organization name must be less than 50 characters."),
});

export default function Onboarding() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const { completeUserOnboarding, user } = useSupabase();
	const router = useRouter();
	const [organizationId, setOrganizationId] = useState("");

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			userName: "",
			organizationName: "",
		},
	});

	// Check if user already has an organization
	useEffect(() => {
		const fetchExistingData = async () => {
			if (!user) return;

			try {
				setIsLoading(true);

				// Check if user already has an organization
				const { data: memberships, error: membershipError } = await supabase
					.from("organization_members")
					.select("organization_id")
					.eq("user_id", user.id);

				if (membershipError) {
					console.error("Error fetching memberships:", membershipError);
					return;
				}

				if (
					memberships &&
					memberships.length > 0 &&
					memberships[0].organization_id
				) {
					// Fetch the organization details
					const { data: organization, error: orgError } = await supabase
						.from("organizations")
						.select("id, name")
						.eq("id", memberships[0].organization_id)
						.single();

					if (orgError) {
						console.error("Error fetching organization:", orgError);
					} else if (organization && organization.name) {
						// Pre-populate the organization name
						form.setValue("organizationName", organization.name);
						setOrganizationId(organization.id);
					}
				}

				// Try to get user's name from profile if it exists
				const { data: profile, error: profileError } = await supabase
					.from("profiles")
					.select("name")
					.eq("id", user.id)
					.single();

				if (!profileError && profile && profile.name) {
					form.setValue("userName", profile.name);
				}
			} catch (error) {
				console.error("Error fetching existing data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchExistingData();
	}, [user, form]);

	async function onSubmit(data: z.infer<typeof formSchema>) {
		try {
			setIsSubmitting(true);

			await completeUserOnboarding({
				userName: data.userName,
				organizationName: data.organizationName,
				organizationId: organizationId,
			});

			// Reset form
			form.reset();

			// Navigate to the main app
			router.replace("/(app)/(protected)");
		} catch (error: any) {
			Alert.alert(
				"Error",
				error.message ||
					"There was an error completing your onboarding. Please try again.",
			);
			console.error("Onboarding error:", error);
		} finally {
			setIsSubmitting(false);
		}
	}

	if (isLoading) {
		return (
			<SafeAreaView
				className="flex-1 bg-background p-4 justify-center items-center"
				edges={["bottom"]}
			>
				<ActivityIndicator size="large" />
				<Text className="mt-4">Loading your information...</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background p-4" edges={["bottom"]}>
			<View className="flex-1 justify-center gap-6">
				<View>
					<H1 className="mb-2">Welcome!</H1>
					<P className="text-muted-foreground">
						Let's set up your profile and organization before you get started.
					</P>
				</View>

				<Form {...form}>
					<View className="gap-4">
						<FormField
							control={form.control}
							name="userName"
							render={({ field }) => (
								<FormInput
									label="Your Name"
									placeholder="Enter your name"
									autoCapitalize="words"
									autoCorrect={false}
									{...field}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="organizationName"
							render={({ field }) => (
								<FormInput
									label="Organization Name"
									placeholder="Enter organization name"
									autoCapitalize="words"
									autoCorrect={false}
									{...field}
								/>
							)}
						/>
					</View>
				</Form>
			</View>

			<Button
				size="default"
				variant="default"
				onPress={form.handleSubmit(onSubmit)}
				disabled={isSubmitting}
				className="mt-4"
			>
				{isSubmitting ? (
					<ActivityIndicator size="small" color="white" />
				) : (
					<Text>Complete Setup</Text>
				)}
			</Button>
		</SafeAreaView>
	);
}
