import { P } from "@/components/ui/typography";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle, XCircle } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { H2 } from "@/components/ui/typography";
import { supabase } from "@/config/supabase";
import { useCreateOrganization } from "@/hooks/useCreateOrganization";

export default function VerifyAccount() {
	const local = useLocalSearchParams();
	const [isCreatingOrg, setIsCreatingOrg] = useState(false);
	const [orgCreated, setOrgCreated] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const createOrganization = useCreateOrganization();

	const { access_token, refresh_token } = useMemo(() => {
		const params = new URLSearchParams(local["#"] as string);
		return {
			access_token: params.get("access_token"),
			refresh_token: params.get("refresh_token"),
			expires_at: params.get("expires_at"),
			expires_in: params.get("expires_in"),
			token_type: params.get("token_type"),
			type: params.get("type"),
		};
	}, []);

	const isVerified = !!access_token;

	useEffect(() => {
		// Create organization for the user if they're verified
		const createOrgForUser = async () => {
			if (!isVerified || !access_token) return;

			try {
				setIsCreatingOrg(true);

				// Set the access token to authenticate the user
				const { error: sessionError, data } = await supabase.auth.setSession({
					access_token: access_token,
					refresh_token: refresh_token || "",
				});

				if (sessionError) throw sessionError;

				const user = data?.user;

				if (!user) throw new Error("User not found");

				// Check if user already has an organization
				const { data: existingMemberships, error: membershipError } =
					await supabase
						.from("organization_members")
						.select("organization_id")
						.eq("user_id", user.id);

				if (membershipError) throw membershipError;

				// If user already has organizations, don't create a new one
				if (existingMemberships && existingMemberships.length > 0) {
					setOrgCreated(true);
					return;
				}

				// Create a new organization with default values
				const organization = await createOrganization.mutateAsync({
					name: `${user.email?.split("@")[0]}'s Organization`,
					userId: user.id,
				});

				if (!organization) throw new Error("Failed to create organization");

				setOrgCreated(true);
			} catch (err: any) {
				console.error("Error creating organization:", err);
				setError(err.message);
			} finally {
				setIsCreatingOrg(false);
			}
		};

		createOrgForUser();
	}, [isVerified, access_token, queryClient, createOrganization]);

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
			<View className="flex-1 justify-center items-center p-8">
				<View className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md items-center">
					{isVerified ? (
						<CheckCircle size={80} color="#16a34a" className="mb-6" />
					) : (
						<XCircle size={80} color="#dc2626" className="mb-6" />
					)}

					<H2
						className={`text-center mb-4 ${isVerified ? "text-green-600" : "text-red-600"}`}
					>
						{isVerified
							? "Your account has been verified!"
							: "Verification failed"}
					</H2>

					{isVerified ? (
						<>
							<P className="text-center text-gray-600 mb-4">
								Your account has been successfully verified. You can now log in
								to access all features.
							</P>

							{isCreatingOrg ? (
								<View className="mb-8 items-center">
									<ActivityIndicator size="small" color="#16a34a" />
									<P className="text-center text-gray-600 mt-2">
										Setting up your account...
									</P>
								</View>
							) : orgCreated ? (
								<P className="text-center text-gray-600 mb-8">
									Your organization has been created successfully!
								</P>
							) : error ? (
								<P className="text-center text-red-500 mb-8">
									There was an error setting up your organization: {error}
								</P>
							) : null}
						</>
					) : (
						<P className="text-center text-gray-600 mb-8">
							We couldn't verify your account. The verification link may have
							expired or is invalid.
						</P>
					)}

					<Button
						className="w-full text-white"
						variant={isVerified ? "default" : "destructive"}
						onPress={() => router.replace("/(app)/welcome")}
						disabled={isCreatingOrg}
					>
						<P className="text-white">
							{isVerified && !error ? "Go to Login" : "Try Again"}
						</P>
					</Button>
				</View>
			</View>
		</SafeAreaView>
	);
}
