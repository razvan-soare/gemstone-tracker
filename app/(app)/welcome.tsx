import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Image } from "@/components/image";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { useLanguage } from "@/hooks/useLanguage";

export default function WelcomeScreen() {
	const router = useRouter();
	const { t } = useLanguage();

	return (
		<SafeAreaView className="flex flex-1 bg-background p-4">
			<View className="flex flex-1 items-center justify-center gap-y-4 web:m-4">
				<Image
					source={require("@/assets/icon.png")}
					className="w-16 h-16 rounded-xl"
				/>
				<H1 className="text-center">{t("auth.welcome").split(" to ")[0]}</H1>
				<H1 className="text-center">gemstone tracker</H1>
			</View>
			<View className="flex flex-col gap-y-4 web:m-4">
				<Button
					size="default"
					variant="default"
					onPress={() => {
						router.push("/sign-up");
					}}
				>
					<Text>{t("auth.signUp")}</Text>
				</Button>
				<Button
					size="default"
					variant="secondary"
					onPress={() => {
						router.push("/sign-in");
					}}
				>
					<Text>{t("auth.signIn")}</Text>
				</Button>
			</View>
		</SafeAreaView>
	);
}
