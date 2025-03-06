import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, P } from "@/components/ui/typography";
import { supabase } from "@/config/supabase";

export default function VerifyAccount() {
	const router = useRouter();
	const { type, token_hash } = useLocalSearchParams<{
		type?: string;
		token_hash?: string;
	}>();

	const [verifying, setVerifying] = useState(false);
	const [verified, setVerified] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const verifyAccount = async () => {
			// Only proceed if we have the necessary parameters
			if (!type || !token_hash) {
				return;
			}

			setVerifying(true);
			setError(null);

			try {
				// Handle email verification
				if (type === "email_change" || type === "signup") {
					// The verification happens automatically when the user clicks the link
					// We just need to check if the session is valid
					const { data, error: sessionError } =
						await supabase.auth.getSession();

					if (sessionError) {
						throw sessionError;
					}

					if (data?.session) {
						setVerified(true);
					} else {
						setError(
							"Verification failed. Please try again or request a new verification link.",
						);
					}
				}
				// else if (type === "recovery") {
				// 	// For password recovery, we redirect to a password reset page
				// 	router.replace({
				// 		pathname: "/reset-password",
				// 		params: { token_hash },
				// 	});
				// 	return;
				// }
			} catch (err: any) {
				setError(err.message || "An error occurred during verification");
			} finally {
				setVerifying(false);
			}
		};

		verifyAccount();
	}, [type, token_hash, router]);

	const handleContinue = () => {
		if (verified) {
			router.replace("/(app)/(protected)");
		} else {
			router.replace("/sign-in");
		}
	};
	console.log("hi");
	return (
		<SafeAreaView className="flex-1 bg-background p-4" edges={["bottom"]}>
			<View className="flex-1 justify-center items-center gap-6">
				<H1 className="text-center">Account Verification</H1>

				{verifying ? (
					<View className="items-center gap-4">
						<ActivityIndicator size="large" />
						<P className="text-center">Verifying your account...</P>
					</View>
				) : error ? (
					<View className="items-center gap-4">
						<P className="text-center text-destructive">{error}</P>
						<Button
							variant="default"
							onPress={() => router.replace("/sign-in")}
						>
							<Text>Back to Sign In</Text>
						</Button>
					</View>
				) : verified ? (
					<View className="items-center gap-4">
						<P className="text-center">
							Your account has been successfully verified!
						</P>
						<Button variant="default" onPress={handleContinue}>
							<Text>Continue to App</Text>
						</Button>
					</View>
				) : (
					<View className="items-center gap-4">
						<P className="text-center">
							{!type || !token_hash
								? "Invalid verification link. Please use the link from your email."
								: "Waiting for verification..."}
						</P>
						<Button
							variant="default"
							onPress={() => router.replace("/sign-in")}
						>
							<Text>Back to Sign In</Text>
						</Button>
					</View>
				)}
			</View>
		</SafeAreaView>
	);
}
