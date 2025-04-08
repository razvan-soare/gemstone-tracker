import {
	Currency,
	CurrencySymbols,
	GemTreatmentEnum,
} from "@/app/types/gemstone";
import { ComboBox } from "@/components/ui/combobox";
import { useOrganizationColors } from "@/hooks/useOrganizationColors";
import { useOrganizationGemstoneTypes } from "@/hooks/useOrganizationGemstoneTypes";
import { useOrganizationOwners } from "@/hooks/useOrganizationOwners";
import { useOrganizationShapes } from "@/hooks/useOrganizationShapes";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Platform } from "react-native";
import { Button, Dialog, Portal, Text, TextInput } from "react-native-paper";
import { DatePickerField } from "@/components/DatePickerField";
import { Dropdown } from "react-native-paper-dropdown";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Define field types for different input components
type FieldType =
	| "text"
	| "number"
	| "date"
	| "currency"
	| "shape"
	| "color"
	| "owner"
	| "gem_treatment"
	| "buy_price"
	| "sell_price"
	| "quantity"
	| "name";

// Define props for the edit field dialog
interface EditFieldDialogProps {
	visible: boolean;
	onDismiss: () => void;
	onSave: (value: any) => void;
	field: {
		name: string;
		label: string;
		type: FieldType;
		value: any;
	};
}

export const EditFieldDialog = ({
	visible,
	onDismiss,
	onSave,
	field,
}: EditFieldDialogProps) => {
	// Get organization-specific values
	const { owners, addOwner } = useOrganizationOwners();
	const { gemstoneTypes, addGemstoneType } = useOrganizationGemstoneTypes();
	const { shapes, addShape } = useOrganizationShapes();
	const { colors: orgColors, addColor } = useOrganizationColors();

	// Set up state for the input value
	const [value, setValue] = useState<any>(field.value);
	const [dateValue, setDateValue] = useState<Date | undefined>(
		field.value ? new Date(field.value) : undefined,
	);
	const [currencyCode, setCurrencyCode] = useState<string>(
		field.type === "buy_price"
			? field.value?.currency || Currency.LKR
			: field.type === "sell_price"
				? field.value?.currency || Currency.RMB
				: Currency.RMB,
	);
	const [priceValue, setPriceValue] = useState<string>(
		field.type === "buy_price" || field.type === "sell_price"
			? field.value?.toString() || ""
			: "",
	);

	// Update value state when field changes
	useEffect(() => {
		setValue(field.value);
		if (field.type === "date" && field.value) {
			setDateValue(new Date(field.value));
		}
		if (
			(field.type === "buy_price" || field.type === "sell_price") &&
			field.value
		) {
			setPriceValue(field.value.toString());
		}
	}, [field]);

	// Handler to ensure numbers are valid before saving
	const handleSaveNumberField = () => {
		let numValue = parseFloat(value);
		if (isNaN(numValue)) {
			numValue = 0;
		}
		onSave(numValue);
		onDismiss();
	};

	// Handler to save date fields
	const handleSaveDateField = () => {
		if (!dateValue) {
			onDismiss();
			return;
		}
		onSave(dateValue.toISOString().split("T")[0]);
		onDismiss();
	};

	// Handler to save currency fields (with price and currency)
	const handleSaveCurrencyField = () => {
		const numValue = parseFloat(priceValue);
		if (isNaN(numValue)) {
			onSave(null);
		} else {
			onSave({
				price: numValue,
				currency: currencyCode,
			});
		}
		onDismiss();
	};

	const renderFieldInput = () => {
		switch (field.type) {
			case "text":
			case "quantity":
				return (
					<TextInput
						label={field.label}
						defaultValue={value || ""}
						onChangeText={setValue}
						mode="outlined"
						style={styles.input}
					/>
				);
			case "number":
				return (
					<TextInput
						label={field.label}
						defaultValue={value?.toString() || ""}
						onChangeText={(val) => {
							// Only allow numbers and decimal points
							const cleaned = val.replace(/[^0-9.]/g, "");
							// Prevent multiple decimal points
							const parts = cleaned.split(".");
							if (parts.length > 2) {
								setValue(parts[0] + "." + parts.slice(1).join(""));
							} else {
								setValue(cleaned);
							}
						}}
						keyboardType="numeric"
						mode="outlined"
						style={styles.input}
					/>
				);
			case "date":
				return (
					<View style={styles.priceContainer} key={field.label}>
						<DatePickerField
							label={field.label}
							date={dateValue}
							onChange={(date) => setDateValue(date)}
						/>
					</View>
				);
			case "currency":
			case "buy_price":
			case "sell_price":
				return (
					<View style={styles.priceContainer} key={field.label}>
						<TextInput
							label={`${field.label} Amount`}
							mode="outlined"
							defaultValue={priceValue || ""}
							autoFocus
							onChangeText={(val) => {
								// Only allow numbers and decimal points
								const cleaned = val.replace(/[^0-9.]/g, "");
								// Prevent multiple decimal points
								const parts = cleaned.split(".");
								if (parts.length > 2) {
									setPriceValue(parts[0] + "." + parts.slice(1).join(""));
								} else {
									setPriceValue(cleaned);
								}
							}}
							keyboardType="decimal-pad"
							style={[styles.priceInput]}
						/>
						<View style={styles.currencyDropdown}>
							<Dropdown
								label="Currency"
								mode="outlined"
								hideMenuHeader
								menuContentStyle={{ top: -40 }}
								value={currencyCode}
								onSelect={(value) => setCurrencyCode(value || Currency.RMB)}
								options={Object.values(Currency).map((currency) => ({
									label: currency,
									value: currency,
								}))}
							/>
						</View>
					</View>
				);
			case "shape":
				return (
					<ComboBox
						label={field.label}
						allowCustom
						value={value}
						options={shapes.map((shape) => ({
							id: shape.name,
							title: shape.name,
						}))}
						onChange={setValue}
						onCreateNewOption={async (newValue) => {
							await addShape.mutateAsync(newValue);
						}}
					/>
				);
			case "color":
				return (
					<ComboBox
						label={field.label}
						allowCustom
						value={value}
						options={orgColors.map((color) => ({
							id: color.name,
							title: color.name,
						}))}
						onChange={setValue}
						onCreateNewOption={async (newValue) => {
							await addColor.mutateAsync(newValue);
						}}
					/>
				);
			case "owner":
				return (
					<ComboBox
						label={field.label}
						allowCustom
						value={value}
						options={owners.map((owner) => ({
							id: owner.name,
							title: owner.name,
						}))}
						onChange={setValue}
						onCreateNewOption={async (newValue) => {
							await addOwner.mutateAsync(newValue);
						}}
					/>
				);
			case "gem_treatment":
				return (
					<ComboBox
						label={field.label}
						allowCustom
						value={value}
						options={Object.values(GemTreatmentEnum).map((treatment) => ({
							id: treatment,
							title: treatment,
						}))}
						onChange={setValue}
						onCreateNewOption={async (newValue) => {
							await addGemstoneType.mutateAsync(newValue);
						}}
					/>
				);
			case "name":
				return (
					<ComboBox
						label={field.label}
						allowCustom
						value={value}
						options={gemstoneTypes.map((type) => ({
							id: type.name,
							title: type.name,
						}))}
						onChange={setValue}
						onCreateNewOption={async (newValue) => {
							await addGemstoneType.mutateAsync(newValue);
						}}
					/>
				);
			default:
				return (
					<TextInput
						label={field.label}
						defaultValue={value?.toString() || ""}
						onChangeText={setValue}
						mode="outlined"
						style={styles.input}
					/>
				);
		}
	};

	const handleSave = () => {
		switch (field.type) {
			case "number":
				handleSaveNumberField();
				break;
			case "date":
				handleSaveDateField();
				break;
			case "currency":
			case "buy_price":
			case "sell_price":
				handleSaveCurrencyField();
				break;
			default:
				onSave(value);
				onDismiss();
		}
	};

	return (
		<Portal>
			<Dialog visible={visible} onDismiss={onDismiss}>
				<Dialog.Title
					style={styles.dialogTitle}
				>{`Edit ${field.label}`}</Dialog.Title>
				<Dialog.Content>
					<View style={styles.container}>{renderFieldInput()}</View>
				</Dialog.Content>
				<Dialog.Actions>
					<Button onPress={onDismiss}>Cancel</Button>
					<Button onPress={handleSave}>Save</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
};

const styles = StyleSheet.create({
	container: {
		minWidth: 250,
	},
	dialogTitle: {
		marginBottom: 16, // Add spacing between title and content
	},
	input: {
		marginBottom: 5,
		marginTop: Platform.OS === "ios" ? 8 : 0, // Add extra top margin on iOS
	},
	priceContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 16,
		gap: 16,
	},
	priceInput: {
		flex: 2,
	},
	currencyDropdown: {
		flex: 1,
	},
});
