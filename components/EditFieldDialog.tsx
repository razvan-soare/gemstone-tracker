import {
	Currency,
	CurrencySymbols,
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
import { Dropdown } from "react-native-paper-dropdown";

// Define field types for different input components
type FieldType =
	| "text"
	| "number"
	| "date"
	| "currency"
	| "shape"
	| "color"
	| "owner"
	| "gem_type"
	| "buy_price"
	| "sell_price";

type EditFieldDialogProps = {
	visible: boolean;
	onDismiss: () => void;
	fieldName: string;
	fieldLabel: string;
	fieldType: FieldType;
	currentValue: any;
	onSave: (value: any) => void;
	currentCurrency?: Currency;
};

export const EditFieldDialog = ({
	visible,
	onDismiss,
	fieldName,
	fieldLabel,
	fieldType,
	currentValue,
	onSave,
	currentCurrency,
}: EditFieldDialogProps) => {
	const [value, setValue] = useState<any>(currentValue);
	const [currency, setCurrency] = useState<Currency>(
		currentCurrency || Currency.RMB,
	);
	const { owners, addOwner } = useOrganizationOwners();

	// Update value when currentValue changes
	useEffect(() => {
		setValue(currentValue);
		if (currentCurrency) {
			setCurrency(currentCurrency);
		}
	}, [currentValue, currentCurrency]);

	const handleSave = () => {
		if (fieldType === "buy_price" || fieldType === "sell_price") {
			// For price fields, we need to save both the price and currency
			onSave({
				price: parseFloat(value),
				currency: currency,
			});
		} else {
			onSave(value);
		}
		onDismiss();
	};

	const renderInputComponent = () => {
		switch (fieldType) {
			case "buy_price":
				return (
					<View>
						<View style={styles.priceContainer}>
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
								style={styles.priceInput}
								left={<TextInput.Affix text={CurrencySymbols[currency]} />}
							/>
							<View style={styles.currencyDropdown}>
								<Dropdown
									label="Currency"
									mode="outlined"
									hideMenuHeader
									menuContentStyle={{ top: 60 }}
									value={currency}
									options={Object.values(Currency).map((curr) => ({
										label: curr,
										value: curr,
									}))}
									onSelect={(value) => setCurrency(value as Currency)}
								/>
							</View>
						</View>
					</View>
				);

			case "sell_price":
				return (
					<View>
						<View style={styles.priceContainer}>
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
								style={styles.priceInput}
								left={<TextInput.Affix text={CurrencySymbols[currency]} />}
							/>
							<View style={styles.currencyDropdown}>
								<Dropdown
									label="Currency"
									mode="outlined"
									hideMenuHeader
									menuContentStyle={{ top: 60 }}
									value={currency}
									options={Object.values(Currency).map((curr) => ({
										label: curr,
										value: curr,
									}))}
									onSelect={(value) => setCurrency(value as Currency)}
								/>
							</View>
						</View>
					</View>
				);

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
					<View style={{ marginTop: 30, marginBottom: 30 }}>
						<DatePickerInput
							locale="en"
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
	priceContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 10,
		gap: 10,
	},
	priceInput: {
		flex: 2,
	},
	currencyDropdown: {
		flex: 1,
	},
});
