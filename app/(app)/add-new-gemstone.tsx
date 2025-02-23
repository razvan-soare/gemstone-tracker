import {
	GemstoneColor,
	GemstoneCut,
	GemstoneShape,
} from "@/app/types/gemstone";
import { H3 } from "@/components/ui/typography";
import { useSupabase } from "@/context/supabase-provider";
import { useCreateGemstone } from "@/hooks/useCreateGemstone";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import {
	Button,
	PaperProvider,
	TextInput,
	Snackbar,
	MD2Colors,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

type ValidationError = {
	field: string;
	message: string;
};

export default function AddNewGemstone() {
	const { activeOrganization } = useSupabase();
	const createGemstone = useCreateGemstone();
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [error, setError] = useState<ValidationError | null>(null);

	const [formData, setFormData] = useState({
		name: "",
		shape: "",
		color: "",
		cut: "",
		weight: "",
		identification: "",
		comment: "",
		date: new Date().toISOString().split("T")[0],
		dimensions: { length: "", width: "", height: "" },
	});

	const updateField = (field: string, value?: string) => {
		if (!value) return;
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const updateDimension = (dimension: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			dimensions: {
				...prev.dimensions,
				[dimension]: value,
			},
		}));
	};

	const handleNumericInput = (value: string, field: string) => {
		// Only allow numbers and decimal point
		const numericValue = value.replace(/[^0-9.]/g, "");
		// Prevent multiple decimal points
		if (numericValue.split(".").length > 2) return;
		updateField(field, numericValue);
	};

	const handleDimensionInput = (value: string, dimension: string) => {
		// Only allow numbers and decimal point
		const numericValue = value.replace(/[^0-9.]/g, "");
		// Prevent multiple decimal points
		if (numericValue.split(".").length > 2) return;
		updateDimension(dimension, numericValue);
	};

	const validateForm = (): ValidationError | null => {
		if (!activeOrganization) {
			return {
				field: "organization",
				message: "No organization found. Please join an organization first.",
			};
		}

		if (!formData.name.trim()) {
			return {
				field: "name",
				message: "Name is required",
			};
		}

		if (formData.weight && isNaN(parseFloat(formData.weight))) {
			return {
				field: "weight",
				message: "Weight must be a valid number",
			};
		}

		const dimensions = Object.entries(formData.dimensions);
		for (const [key, value] of dimensions) {
			if (value && isNaN(parseFloat(value))) {
				return {
					field: `dimensions.${key}`,
					message: `${key.charAt(0).toUpperCase() + key.slice(1)} must be a valid number`,
				};
			}
		}

		return null;
	};

	const handleSubmit = async () => {
		const validationError = validateForm();
		if (validationError) {
			setError(validationError);
			setSnackbarVisible(true);
			return;
		}

		if (!activeOrganization) {
			return;
		}

		try {
			await createGemstone.mutateAsync({
				...formData,
				organization_id: activeOrganization.id,
				pictures: [],
				weight: formData.weight ? parseFloat(formData.weight) : null,
				dimensions: Object.values(formData.dimensions).some((v) => v)
					? formData.dimensions
					: null,
			});
			router.back();
		} catch (error) {
			setError({
				field: "submit",
				message: "Failed to create gemstone. Please try again later.",
			});
			setSnackbarVisible(true);
			console.error("Error creating gemstone:", error);
		}
	};

	if (!activeOrganization) {
		return (
			<View style={styles.container}>
				<H3>No organization found. Please join an organization first.</H3>
			</View>
		);
	}

	return (
		<PaperProvider>
			<ScrollView style={styles.container}>
				<TextInput
					label="Name"
					mode="outlined"
					value={formData.name}
					onChangeText={(value) => updateField("name", value)}
					style={[styles.input, error?.field === "name" && styles.inputError]}
					error={error?.field === "name"}
				/>

				<View style={styles.input}>
					<Dropdown
						label="Shape"
						mode="outlined"
						hideMenuHeader
						menuContentStyle={{ top: -50 }}
						value={formData.shape}
						onSelect={(value) => updateField("shape", value)}
						options={Object.values(GemstoneShape).map((shape) => ({
							label: shape,
							value: shape,
						}))}
					/>
				</View>

				<View style={styles.input}>
					<Dropdown
						label="Color"
						mode="outlined"
						hideMenuHeader
						menuContentStyle={{ top: -50 }}
						value={formData.color}
						onSelect={(value) => updateField("color", value)}
						options={Object.values(GemstoneColor).map((color) => ({
							label: color,
							value: color,
						}))}
					/>
				</View>

				<View style={styles.input}>
					<Dropdown
						label="Cut"
						mode="outlined"
						hideMenuHeader
						menuContentStyle={{ top: -50 }}
						value={formData.cut}
						onSelect={(value) => updateField("cut", value)}
						options={Object.values(GemstoneCut).map((cut) => ({
							label: cut,
							value: cut,
						}))}
					/>
				</View>

				<TextInput
					label="Weight (carats)"
					mode="outlined"
					value={formData.weight}
					onChangeText={(value) => handleNumericInput(value, "weight")}
					keyboardType="decimal-pad"
					style={[styles.input, error?.field === "weight" && styles.inputError]}
					error={error?.field === "weight"}
				/>

				<TextInput
					label="Identification"
					mode="outlined"
					value={formData.identification}
					onChangeText={(value) => updateField("identification", value)}
					style={styles.input}
				/>

				<View style={styles.dimensionsContainer}>
					<TextInput
						label="Length"
						mode="outlined"
						value={formData.dimensions.length}
						onChangeText={(value) => handleDimensionInput(value, "length")}
						keyboardType="decimal-pad"
						style={styles.dimensionInput}
					/>
					<TextInput
						label="Width"
						mode="outlined"
						value={formData.dimensions.width}
						onChangeText={(value) => handleDimensionInput(value, "width")}
						keyboardType="decimal-pad"
						style={styles.dimensionInput}
					/>
					<TextInput
						label="Height"
						mode="outlined"
						value={formData.dimensions.height}
						onChangeText={(value) => handleDimensionInput(value, "height")}
						keyboardType="decimal-pad"
						style={styles.dimensionInput}
					/>
				</View>

				<TextInput
					label="Comments"
					mode="outlined"
					value={formData.comment}
					onChangeText={(value) => updateField("comment", value)}
					multiline
					numberOfLines={3}
					style={styles.input}
				/>

				<Button
					mode="contained"
					onPress={handleSubmit}
					loading={createGemstone.isPending}
					disabled={createGemstone.isPending}
					style={styles.button}
				>
					Add Gemstone
				</Button>

				<Snackbar
					visible={snackbarVisible}
					onDismiss={() => {
						setSnackbarVisible(false);
						setError(null);
					}}
					duration={4000}
					style={styles.errorSnackbar}
					action={{
						label: "Dismiss",
						onPress: () => {
							setSnackbarVisible(false);
							setError(null);
						},
					}}
				>
					{error?.message || ""}
				</Snackbar>
			</ScrollView>
		</PaperProvider>
	);
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: "#fff",
	},
	title: {
		marginBottom: 20,
	},
	input: {
		marginBottom: 16,
	},
	inputError: {
		borderColor: MD2Colors.red500,
	},
	dimensionsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 16,
		gap: 16,
	},
	dimensionInput: {
		flex: 1,
	},
	button: {
		marginTop: 8,
		marginBottom: 24,
	},

	errorSnackbar: {
		backgroundColor: MD2Colors.red800,
	},
});
