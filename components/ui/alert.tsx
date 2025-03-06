import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";
import { Text } from "./text";

export type AlertIntentType = "info" | "success" | "warning" | "error";

export interface AlertProps {
	title?: string;
	description?: string;
	intent?: AlertIntentType;
	className?: string;
}

const intentToIcon: Record<AlertIntentType, { name: string; color: string }> = {
	info: { name: "information-circle", color: "text-blue-500" },
	success: { name: "checkmark-circle", color: "text-green-500" },
	warning: { name: "warning", color: "text-amber-500" },
	error: { name: "alert-circle", color: "text-red-500" },
};

const intentToBackgroundColor: Record<AlertIntentType, string> = {
	info: "bg-blue-50",
	success: "bg-green-50",
	warning: "bg-amber-50",
	error: "bg-red-50",
};

const intentToBorderColor: Record<AlertIntentType, string> = {
	info: "border-blue-200",
	success: "border-green-200",
	warning: "border-amber-200",
	error: "border-red-200",
};

export function Alert({
	title,
	description,
	intent = "info",
	className,
}: AlertProps) {
	const { name, color } = intentToIcon[intent];

	return (
		<View
			className={cn(
				"rounded-md p-4 border",
				intentToBackgroundColor[intent],
				intentToBorderColor[intent],
				className,
			)}
		>
			<View className="flex-row items-center gap-2">
				<Ionicons
					name={name as any}
					size={24}
					className={color}
					color={
						color.includes("blue")
							? "#3b82f6"
							: color.includes("green")
								? "#22c55e"
								: color.includes("amber")
									? "#f59e0b"
									: color.includes("red")
										? "#ef4444"
										: undefined
					}
				/>
				{title && <Text className="font-medium text-base">{title}</Text>}
			</View>
			{description && (
				<Text className="mt-2 text-sm text-gray-700">{description}</Text>
			)}
		</View>
	);
}
