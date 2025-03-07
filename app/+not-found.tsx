import { View } from "react-native";
import { Link } from "expo-router";

import { Button } from "@/components/ui/button";
import { H1, P, Muted } from "@/components/ui/typography";

export default function NotFound() {
	return (
		<View className="flex flex-1 items-center justify-center bg-background p-4 gap-y-6">
			<View className="items-center gap-y-2">
				<H1 className="text-center">404</H1>
				<P className="text-center font-medium">Page Not Found</P>
				<Muted className="text-center">
					The page you are looking for doesn't exist or has been moved.
				</Muted>
			</View>

			<Link href="/" asChild>
				<Button variant="default">Go to Home</Button>
			</Link>
		</View>
	);
}
