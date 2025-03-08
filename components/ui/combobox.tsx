import { cn } from "@/lib/utils";
import * as React from "react";
import { Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { AutocompleteDropdown } from "react-native-autocomplete-dropdown";

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
	allowCustom?: boolean;
};

const ComboBoxComponent = ({
	value,
	options,
	onChange,
	placeholder = "Select or type...",
	label,
	className,
	allowCustom = false,
}: ComboBoxProps) => {
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const [inputText, setInputText] = React.useState("");
	const [displayOptions, setDisplayOptions] =
		React.useState<ComboBoxOption[]>(options);

	// Define colors based on theme
	const colors = {
		background: isDark ? "#1f2937" : "white",
		text: isDark ? "#e5e7eb" : "#1f2937",
		border: isDark ? "#374151" : "#e5e7eb",
		dropdownBackground: isDark ? "#111827" : "white",
		placeholderText: isDark ? "#9ca3af" : "#6b7280",
		buttonBackground: isDark ? "#374151" : "#e5e7eb",
		buttonText: isDark ? "#e5e7eb" : "#1f2937",
	};

	// Check if the value exists in options and update displayOptions
	React.useEffect(() => {
		// Start with the original options
		let newOptions = [...options];

		// If value doesn't exist in options but we have a value, add it as a temporary option
		if (
			value &&
			!options.some((option) => option.id === value || option.title === value)
		) {
			newOptions = [{ id: value, title: value }, ...newOptions];
		}

		setDisplayOptions(newOptions);
	}, [value, options]);

	// Custom EmptyResultView component
	const EmptyResultComponent = React.useMemo(() => {
		if (!inputText || !allowCustom) return undefined;

		return (
			<View style={{ padding: 10, alignItems: "center" }}>
				<TouchableOpacity
					onPress={() => {
						onChange(inputText);
					}}
					style={{
						backgroundColor: colors.buttonBackground,
						padding: 10,
						borderRadius: 4,
						width: "100%",
						alignItems: "center",
					}}
				>
					<Text style={{ color: colors.buttonText }}>
						Use "{inputText}" as custom value
					</Text>
				</TouchableOpacity>
			</View>
		);
	}, [inputText, allowCustom, colors, onChange]);

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
				initialValue={value ? { id: value, title: value } : undefined}
				clearOnFocus={false}
				closeOnBlur={true}
				closeOnSubmit={false}
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
				onChangeText={(text) => {
					setInputText(text);
				}}
				onSelectItem={(item) => {
					if (item) {
						onChange(item.title || "");
					}
				}}
				EmptyResultComponent={EmptyResultComponent}
				dataSet={displayOptions}
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
			prevProps.value === nextProps.value &&
			prevProps.placeholder === nextProps.placeholder &&
			prevProps.label === nextProps.label &&
			prevProps.className === nextProps.className &&
			prevProps.allowCustom === nextProps.allowCustom &&
			JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options)
		);
	},
);
