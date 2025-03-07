import * as React from "react";
import { AutocompleteDropdown } from "react-native-autocomplete-dropdown";
import { useColorScheme, View, Text } from "react-native";
import { cn } from "@/lib/utils";

export type ComboBoxOption = {
	id: string;
	title: string;
};

export type ComboBoxProps = {
	value: string;
	options: ComboBoxOption[];
	onChange: (value: string) => void;
	placeholder?: string;
	label?: string;
	className?: string;
};

const ComboBoxComponent = ({
	value,
	options,
	onChange,
	placeholder = "Select or type...",
	label,
	className,
}: ComboBoxProps) => {
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";

	// Define colors based on theme
	const colors = {
		background: isDark ? "#1f2937" : "white",
		text: isDark ? "#e5e7eb" : "#1f2937",
		border: isDark ? "#374151" : "#e5e7eb",
		dropdownBackground: isDark ? "#111827" : "white",
		placeholderText: isDark ? "#9ca3af" : "#6b7280",
	};

	return (
		<View className={cn("w-full", className)}>
			{label && (
				<Text
					className="mb-1.5 text-sm font-medium"
					style={{ color: colors.text }}
				>
					{label}
				</Text>
			)}
			<AutocompleteDropdown
				// initialValue={value ? { id: value } : undefined}
				clearOnFocus={false}
				closeOnBlur={true}
				textInputProps={{
					placeholder,
					placeholderTextColor: colors.placeholderText,
					style: {
						color: colors.text,
					},
				}}
				inputContainerStyle={{
					backgroundColor: colors.background,
					borderWidth: 1,
					borderColor: colors.border,
					borderRadius: 4,
				}}
				suggestionsListContainerStyle={{
					backgroundColor: colors.dropdownBackground,
				}}
				suggestionsListTextStyle={{
					color: colors.text,
				}}
				closeOnSubmit={false}
				onChangeText={(text) => onChange(text)}
				onSelectItem={(value) => onChange(value?.title || "")}
				dataSet={options}
			/>
		</View>
	);
};

// Memoize the component to prevent unnecessary re-renders
export const ComboBox = React.memo(
	ComboBoxComponent,
	(prevProps, nextProps) => {
		// Custom comparison function to determine if re-render is needed
		// Return true if props are equal (no re-render needed)
		return (
			prevProps.placeholder === nextProps.placeholder &&
			prevProps.label === nextProps.label &&
			prevProps.className === nextProps.className &&
			JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options)
		);
	},
);
