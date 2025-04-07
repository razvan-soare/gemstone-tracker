import { cn } from "@/lib/utils";
import * as React from "react";
import { useEffect } from "react";
import {
	Button,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {
	AutocompleteDropdown,
	AutocompleteDropdownItem,
} from "react-native-autocomplete-dropdown";

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
	onCreateNewOption?: (value: string) => Promise<void>;
};

export const ComboBox = ({
	value,
	options,
	onChange,
	placeholder = "Select or type...",
	label,
	className,
	allowCustom = false,
	onCreateNewOption,
}: ComboBoxProps) => {
	const [keyValue, setKeyValue] = React.useState(0);
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const [inputText, setInputText] = React.useState("");
	const [displayOptions, setDisplayOptions] =
		React.useState<ComboBoxOption[]>(options);
	const [selectedItem, setSelectedItem] = React.useState<
		AutocompleteDropdownItem | undefined
	>(value ? { id: value, title: value } : undefined);

	useEffect(() => {
		if (!value) {
			setInputText("");
			setSelectedItem(undefined);
			setKeyValue(keyValue + 1);
		} else if (value && (!selectedItem || selectedItem.title !== value)) {
			setSelectedItem({ id: value, title: value });
		}
	}, [value, selectedItem]);

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
	}, [value, options, inputText, allowCustom]);

	// Handle change with option creation
	const handleChange = async (selectedValue: string) => {
		onChange(selectedValue);

		// If this is a new value and we have a handler for creating new options
		if (
			selectedValue &&
			!options.some(
				(option) =>
					option.id === selectedValue || option.title === selectedValue,
			) &&
			onCreateNewOption &&
			allowCustom
		) {
			try {
				await onCreateNewOption(selectedValue);
			} catch (error) {
				console.error("Error creating new option:", error);
			}
		}
	};

	const handleBlur = () => {
		setInputText(selectedItem?.title || "");
	};

	// Custom EmptyResultView component
	const EmptyResultComponent = React.useMemo(() => {
		if (!inputText || !allowCustom) return undefined;

		return (
			<View style={{ padding: 10, alignItems: "center" }}>
				<TouchableOpacity
					onPress={() => {
						const newItem: AutocompleteDropdownItem = {
							id: inputText,
							title: inputText,
						};
						setSelectedItem(newItem);
						handleChange(inputText);
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
	}, [inputText, allowCustom, colors, handleChange]);

	const isNewValue =
		inputText && !options.some((option) => option.title === inputText);

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
				key={keyValue}
				initialValue={selectedItem}
				RightIconComponent={
					isNewValue ? (
						<View className="bg-gray-500 rounded-full px-2 py-1">
							<TouchableOpacity
								onPress={() => {
									const newItem: AutocompleteDropdownItem = {
										id: inputText,
										title: inputText,
									};
									setSelectedItem(newItem);
									handleChange(inputText);
								}}
							>
								<Text className="text-white">+</Text>
							</TouchableOpacity>
						</View>
					) : undefined
				}
				clearOnFocus={false}
				closeOnBlur={true}
				closeOnSubmit={false}
				onBlur={handleBlur}
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
						setSelectedItem(item);
						handleChange(item.title || "");
						setInputText(item.title || "");
					}
				}}
				EmptyResultComponent={EmptyResultComponent}
				dataSet={displayOptions}
			/>
		</View>
	);
};
