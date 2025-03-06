import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle, XCircle } from "lucide-react-native";
import { useMemo } from "react";
import { View } from "react-native";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { H2, P } from "@/components/ui/typography";

export default function VerifyAccount() {
	const local = useLocalSearchParams();
	const { access_token } = useMemo(() => {
		const params = new URLSearchParams(local["#"] as string);

		return {
			access_token: params.get("access_token"),
		};
	}, []);

	const isVerified = !!access_token;

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
						<P className="text-center text-gray-600 mb-8">
							Your account has been successfully verified. You can now log in to
							access all features.
						</P>
					) : (
						<P className="text-center text-gray-600 mb-8">
							We couldn't verify your account. The verification link may have
							expired or is invalid.
						</P>
					)}

					<Button
						className="w-full text-white"
						variant={isVerified ? "default" : "destructive"}
						onPress={() => router.replace("/welcome")}
					>
						{isVerified ? "Go to Login" : "Try Again"}
					</Button>
				</View>
			</View>
		</SafeAreaView>
	);
}
