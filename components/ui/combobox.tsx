import * as React from "react";
import {
	LayoutChangeEvent,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	ViewStyle,
	TextStyle,
	Platform,
} from "react-native";
import { Menu } from "react-native-paper";

export type ComboBoxOption = {
	label: string;
	value: string;
};

export type ComboBoxProps = {
	label: string;
	value: string;
	options: ComboBoxOption[];
	onChange: (value: string) => void;
	placeholder?: string;
	style?: ViewStyle;
	menuStyle?: ViewStyle;
	disabled?: boolean;
};

export function ComboBox({
	label,
	value,
	options,
	onChange,
	placeholder = "Select or type...",
	style,
	menuStyle,
	disabled = false,
}: ComboBoxProps) {
	const [visible, setVisible] = React.useState(false);
	const [inputWidth, setInputWidth] = React.useState(0);
	const [customValue, setCustomValue] = React.useState("");
	const [menuPosition, setMenuPosition] = React.useState({ x: 0, y: 0 });
	const inputContainerRef = React.useRef<View>(null);

	// Initialize customValue with the provided value
	React.useEffect(() => {
		// If value is not in options, it's a custom value
		if (value && !options.some((option) => option.value === value)) {
			setCustomValue(value);
		} else {
			setCustomValue("");
		}
	}, [value, options]);

	const openMenu = () => {
		if (!disabled) {
			// Measure the position of the input for menu placement
			if (inputContainerRef.current) {
				inputContainerRef.current.measureInWindow((x, y, width, height) => {
					// Position the dropdown 5px below the input field
					// Add platform-specific adjustments if needed
					// const yOffset = Platform.OS === "ios" ? 5 : 5;
					setMenuPosition({ x, y: y + height + 5 });
					setInputWidth(width);
					setVisible(true);
				});
			}
		}
	};

	const closeMenu = () => setVisible(false);

	const handleLayout = (event: LayoutChangeEvent) => {
		setInputWidth(event.nativeEvent.layout.width);
	};

	const handleInputChange = (text: string) => {
		setCustomValue(text);
		onChange(text);
	};

	const displayValue = React.useMemo(() => {
		// If there's a matching option, display its label
		const selectedOption = options.find((option) => option.value === value);
		if (selectedOption) {
			return selectedOption.label;
		}
		// Otherwise, display the custom value
		return value;
	}, [value, options]);

	return (
		<View style={[styles.container, style]}>
			{label && <Text style={styles.label}>{label}</Text>}
			<View
				ref={inputContainerRef}
				onLayout={handleLayout}
				style={styles.inputContainer}
			>
				<TextInput
					value={displayValue}
					onChangeText={handleInputChange}
					placeholder={placeholder}
					onFocus={openMenu}
					editable={!disabled}
					style={[styles.input, disabled && styles.disabled]}
				/>
				<TouchableOpacity
					style={styles.dropdownIcon}
					onPress={openMenu}
					disabled={disabled}
				>
					<Text style={styles.dropdownIconText}>{visible ? "▲" : "▼"}</Text>
				</TouchableOpacity>
			</View>

			<Menu
				visible={visible}
				onDismiss={closeMenu}
				anchor={{ x: menuPosition.x, y: menuPosition.y }}
				style={[styles.menu, { width: inputWidth }, menuStyle]}
				contentStyle={styles.menuContent}
			>
				<ScrollView style={styles.menuScrollView} nestedScrollEnabled={true}>
					{options.map((option) => (
						<TouchableOpacity
							key={option.value}
							style={styles.menuItem}
							onPress={() => {
								onChange(option.value);
								closeMenu();
							}}
						>
							<Text style={styles.menuItemText}>{option.label}</Text>
						</TouchableOpacity>
					))}
					{customValue &&
						!options.some(
							(option) =>
								option.label.toLowerCase() === customValue.toLowerCase(),
						) && (
							<TouchableOpacity
								style={[styles.menuItem, styles.customMenuItem]}
								onPress={() => {
									onChange(customValue);
									closeMenu();
								}}
							>
								<Text style={styles.menuItemText}>Add "{customValue}"</Text>
							</TouchableOpacity>
						)}
				</ScrollView>
			</Menu>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {},
	label: {
		fontSize: 16,
		marginBottom: 8,
		fontWeight: "500",
	},
	inputContainer: {
		position: "relative",
	},
	input: {
		height: 48,
		borderWidth: 1,
		borderColor: "#a7a5ac",
		borderRadius: 4,
		paddingHorizontal: 12,
		paddingRight: 40, // Space for dropdown icon
		fontSize: 16,
		backgroundColor: "#fffbfe",
	},
	disabled: {
		backgroundColor: "#f0f0f0",
		opacity: 0.7,
	},
	dropdownIcon: {
		position: "absolute",
		right: 12,
		top: 0,
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
		width: 24,
	},
	dropdownIconText: {
		fontSize: 14,
		color: "#666",
	},
	menu: {
		marginTop: 0, // Remove any default margin
		elevation: 4, // Add elevation for Android
		shadowColor: "#000", // Shadow for iOS
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
		borderRadius: 8,
		backgroundColor: "#fff",
	},
	menuContent: {
		paddingVertical: 0,
	},
	menuScrollView: {
		maxHeight: 200,
	},
	menuItem: {
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	menuItemText: {
		fontSize: 16,
	},
	customMenuItem: {
		backgroundColor: "#f5f5f5",
		borderTopWidth: 1,
		borderTopColor: "#eee",
	},
});
