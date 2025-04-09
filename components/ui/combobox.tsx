import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Text, useColorScheme, View } from "react-native";
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
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const [inputText, setInputText] = useState("");
	const [displayOptions, setDisplayOptions] =
		useState<ComboBoxOption[]>(options);
	const [filteredOptions, setFilteredOptions] = useState<
		{
			id: string;
			title: string;
		}[]
	>(options);

	useEffect(() => {
		if (options && options.length !== displayOptions.length) {
			setDisplayOptions(options);
		}
	}, [options]);

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

	const isNewValue =
		inputText && !options.some((option) => option.title === inputText);

	const handleTextChange = (q: string) => {
		setInputText(q);
		const filterToken = q.toLowerCase();

		const suggestions = options
			.filter((item) => item.title.toLowerCase().includes(filterToken))
			.map((item) => ({
				id: item.id,
				title: item.title,
			}));
		setFilteredOptions(suggestions);
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
				initialValue={{ id: value, title: value }}
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
				onChangeText={handleTextChange}
				onSelectItem={(item) => {
					if (item) {
						console.log("Selected item:", item);
						if (item.id === "-1") {
							// Handle the custom option creation
							if (onCreateNewOption) {
								onCreateNewOption(inputText);
							}
							setInputText(inputText);
							onChange(inputText);
							return;
						}
						onChange(item.title || "");
						setInputText(item.title || "");
					}
				}}
				useFilter={false}
				suggestionsListMaxHeight={200}
				dataSet={[
					...(isNewValue && allowCustom && inputText
						? [
								{
									id: "-1",
									title: inputText,
								},
							]
						: []),

					...filteredOptions.map((option) => ({
						id: option.id,
						title: option.title,
					})),
				]}
			/>
		</View>
	);
};
