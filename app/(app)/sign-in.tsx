import { zodResolver } from "@hookform/resolvers/zod";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, View } from "react-native";
import * as z from "zod";

import { SafeAreaView } from "@/components/safe-area-view";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormInput } from "@/components/ui/form";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { useSupabase } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";

const formSchema = z.object({
	email: z.string().email("Please enter a valid email address."),
	password: z
		.string()
		.min(8, "Please enter at least 8 characters.")
		.max(64, "Please enter fewer than 64 characters."),
});

export default function SignIn() {
	const { signInWithPassword } = useSupabase();
	const [devTapCount, setDevTapCount] = useState(0);
	const router = useRouter();
	const [loginError, setLoginError] = useState<string | null>(null);
	const [minVersion, setMinVersion] = useState<string | null>(null);
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	async function onSubmit(data: z.infer<typeof formSchema>) {
		try {
			setLoginError(null);
			await signInWithPassword(data.email, data.password);
			form.reset();
		} catch (error: Error | any) {
			console.log(error.message);
			setLoginError(
				error.message ||
					"Invalid login credentials. Please check your email and password.",
			);
		}
	}

	const handleBuildNumberPress = () => {
		const newCount = devTapCount + 1;
		setDevTapCount(newCount);

		// Navigate to debug screen after 7 taps
		if (newCount >= 7) {
			router.push("/debug");
			setDevTapCount(0);
		}

		// Reset count after 3 seconds
		setTimeout(() => {
			setDevTapCount(0);
		}, 3000);
	};

	return (
		<SafeAreaView className="flex-1 bg-background p-4" edges={["bottom"]}>
			<View className="flex-1 gap-4 web:m-4">
				<H1 className="self-start ">Login</H1>

				<Form {...form}>
					<View className="gap-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormInput
									label="Email"
									placeholder="Email"
									autoCapitalize="none"
									autoComplete="email"
									autoCorrect={false}
									keyboardType="email-address"
									{...field}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormInput
									label="Password"
									placeholder="Password"
									autoCapitalize="none"
									autoCorrect={false}
									secureTextEntry
									{...field}
								/>
							)}
						/>
					</View>
				</Form>
				{loginError && (
					<Alert title="Login Failed" intent="error" description={loginError} />
				)}
			</View>

			<View className="web:m-4 gap-2">
				<Button
					size="default"
					variant="default"
					onPress={form.handleSubmit(onSubmit)}
					disabled={form.formState.isSubmitting}
				>
					{form.formState.isSubmitting ? (
						<ActivityIndicator size="small" />
					) : (
						<Text>Login</Text>
					)}
				</Button>
				<Pressable onPress={handleBuildNumberPress}>
					<Text className="text-sm text-gray-500 text-center">
						{Constants.expoConfig?.ios?.buildNumber || "Unknown"}
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}
