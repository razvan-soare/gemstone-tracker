import {
	Currency,
	GemstoneColor,
	GemstoneOwner,
	GemstoneShape,
	GemTypeEnum,
	GemTypeLabels,
} from "@/app/types/gemstone";
import { ComboBox } from "@/components/ui/combobox";
import { useOrganizationOwners } from "@/hooks/useOrganizationOwners";
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

type EditFieldDialogProps = {
	visible: boolean;
	onDismiss: () => void;
	fieldName: string;
	fieldLabel: string;
	fieldType: FieldType;
	currentValue: any;
	onSave: (value: any) => void;
};

export const EditFieldDialog = ({
	visible,
	onDismiss,
	fieldName,
	fieldLabel,
	fieldType,
	currentValue,
	onSave,
}: EditFieldDialogProps) => {
	const [value, setValue] = useState<any>(currentValue);
	const { owners, addOwner } = useOrganizationOwners();

	// Update value when currentValue changes
	useEffect(() => {
		setValue(currentValue);
	}, [currentValue]);

	const handleSave = () => {
		onSave(value);
		onDismiss();
	};

	const renderInputComponent = () => {
		switch (fieldType) {
			case "number":
				return (
					<TextInput
						label={fieldLabel}
						mode="outlined"
						value={String(value || "")}
						onChangeText={(text) => {
							// Only allow numbers and decimal point
							const numericValue = text.replace(/[^0-9.]/g, "");
							// Prevent multiple decimal points
							if (numericValue.split(".").length > 2) return;
							setValue(numericValue);
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
							options={owners.map((owner) => ({
								id: owner.name,
								title: owner.name,
							}))}
							allowCustom={true}
							onChange={(selectedValue) => setValue(selectedValue)}
							onCreateNewOption={async (newValue) => {
								await addOwner.mutateAsync(newValue);
							}}
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
		padding: 10,
	},
	input: {
		marginBottom: 10,
	},
});
