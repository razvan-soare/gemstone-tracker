import {
	Currency,
	GemstoneColor,
	GemstoneOwner,
	GemstoneShape,
	GemTypeEnum,
	GemTypeLabels,
} from "@/app/types/gemstone";
import { ComboBox } from "@/components/ui/combobox";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, TextInput } from "react-native-paper";
import { DatePickerInput } from "react-native-paper-dates";

// Define field types for different input components
type FieldType =
	| "text"
	| "number"
	| "date"
	| "currency"
	| "shape"
	| "color"
	| "owner"
	| "gem_type";

interface EditFieldDialogProps {
	visible: boolean;
	onDismiss: () => void;
	fieldName: string;
	fieldLabel: string;
	fieldType: FieldType;
	currentValue: any;
	onSave: (value: any) => void;
}

export const EditFieldDialog = ({
	visible,
	onDismiss,
	fieldName,
	fieldLabel,
	fieldType,
	currentValue,
	onSave,
}: EditFieldDialogProps) => {
	// State to hold the edited value
	const [value, setValue] = useState<any>(currentValue);

	// Reset value when dialog opens with new field
	useEffect(() => {
		setValue(currentValue);
	}, [currentValue, fieldName, visible]);

	// Handle save button click
	const handleSave = () => {
		onSave(value);
		onDismiss();
	};

	// Render the appropriate input component based on field type
	const renderInputComponent = () => {
		switch (fieldType) {
			case "text":
				return (
					<TextInput
						// label={fieldLabel}
						mode="outlined"
						autoFocus={true}
						value={value || ""}
						onChangeText={(text) => setValue(text)}
						style={styles.input}
					/>
				);

			case "number":
				return (
					<TextInput
						// label={fieldLabel}
						mode="outlined"
						autoFocus={true}
						value={String(value || "")}
						onChangeText={(text) => {
							// For quantity, ensure it's a positive integer
							if (fieldName === "quantity") {
								const numericValue = text.replace(/[^0-9]/g, "");
								const finalValue = numericValue === "" ? "1" : numericValue;
								setValue(finalValue);
							} else {
								// For other numeric fields like weight, allow decimal values
								setValue(text ? parseFloat(text) : null);
							}
						}}
						keyboardType="decimal-pad"
						style={styles.input}
					/>
				);

			case "date":
				return (
					<View style={styles.input}>
						<DatePickerInput
							locale="en"
							label={fieldLabel}
							value={value ? new Date(value) : undefined}
							onChange={(date) => {
								setValue(date ? date.toISOString() : null);
							}}
							inputMode="start"
							mode="outlined"
							presentationStyle="pageSheet"
							withDateFormatInLabel={false}
						/>
					</View>
				);

			case "currency":
				return (
					<View style={styles.input}>
						<ComboBox
							// label={fieldLabel}
							value={value || ""}
							options={Object.values(Currency).map((currency) => ({
								id: currency,
								title: currency,
							}))}
							onChange={(selectedValue) => setValue(selectedValue)}
						/>
					</View>
				);

			case "shape":
				return (
					<View style={styles.input}>
						<ComboBox
							// label={fieldLabel}
							value={value || ""}
							options={Object.values(GemstoneShape).map((shape) => ({
								id: shape,
								title: shape,
							}))}
							onChange={(selectedValue) => setValue(selectedValue)}
						/>
					</View>
				);

			case "color":
				return (
					<View style={styles.input}>
						<ComboBox
							// label={fieldLabel}
							value={value || ""}
							options={Object.values(GemstoneColor).map((color) => ({
								id: color,
								title: color,
							}))}
							onChange={(selectedValue) => setValue(selectedValue)}
						/>
					</View>
				);

			case "owner":
				return (
					<View style={styles.input}>
						<ComboBox
							// label={fieldLabel}
							value={value || ""}
							options={[
								...Object.values(GemstoneOwner).map((owner) => ({
									id: owner,
									title: owner,
								})),
								// Allow custom owner values
								...(value &&
								!Object.values(GemstoneOwner).includes(value as any)
									? [{ id: value, title: value }]
									: []),
							]}
							allowCustom={true}
							onChange={(selectedValue) => setValue(selectedValue)}
						/>
					</View>
				);

			case "gem_type":
				return (
					<View style={styles.input}>
						<ComboBox
							// label={fieldLabel}
							value={value || ""}
							options={Object.values(GemTypeEnum).map((type) => ({
								id: type,
								title: GemTypeLabels[type],
							}))}
							onChange={(selectedValue) => setValue(selectedValue)}
						/>
					</View>
				);

			default:
				return (
					<TextInput
						label={fieldLabel}
						mode="outlined"
						value={String(value || "")}
						onChangeText={(text) => setValue(text)}
						style={styles.input}
					/>
				);
		}
	};

	return (
		<Portal>
			<Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
				<Dialog.Title>Edit {fieldLabel}</Dialog.Title>
				<Dialog.Content>{renderInputComponent()}</Dialog.Content>
				<Dialog.Actions>
					<Button onPress={onDismiss}>Cancel</Button>
					<Button onPress={handleSave}>Save</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
};

const styles = StyleSheet.create({
	dialog: {
		borderRadius: 8,
	},
	input: {
		marginTop: 8,
		marginBottom: 8,
	},
});
