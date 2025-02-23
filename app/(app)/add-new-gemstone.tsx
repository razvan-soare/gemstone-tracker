import { H3 } from "@/components/ui/typography";
import { useCreateGemstone } from "@/hooks/useCreateGemstone";
import { useOrganizations } from "@/hooks/useOrganizations";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Button, TextInput } from "react-native-paper";

export default function AddNewGemstone() {
	const { data: organizations = [], isLoading: isLoadingOrgs } =
		useOrganizations();
	const createGemstone = useCreateGemstone();

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

	const updateField = (field: string, value: string) => {
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

	const handleSubmit = async () => {
		if (!organizations.length) {
			console.error("No organization found");
			return;
		}

		try {
			await createGemstone.mutateAsync({
				...formData,
				organization_id: organizations[0].id,
				pictures: [],
				weight: formData.weight ? parseFloat(formData.weight) : null,
				dimensions: Object.values(formData.dimensions).some((v) => v)
					? formData.dimensions
					: null,
			});
			router.back();
		} catch (error) {
			console.error("Error creating gemstone:", error);
		}
	};

	if (isLoadingOrgs) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	if (!organizations.length) {
		return (
			<View style={styles.container}>
				<H3>No organization found. Please join an organization first.</H3>
			</View>
		);
	}

	return (
		<ScrollView style={styles.container}>
			<TextInput
				label="Name"
				value={formData.name}
				onChangeText={(value) => updateField("name", value)}
				style={styles.input}
			/>

			<TextInput
				label="Shape"
				value={formData.shape}
				onChangeText={(value) => updateField("shape", value)}
				style={styles.input}
			/>

			<TextInput
				label="Color"
				value={formData.color}
				onChangeText={(value) => updateField("color", value)}
				style={styles.input}
			/>

			<TextInput
				label="Cut"
				value={formData.cut}
				onChangeText={(value) => updateField("cut", value)}
				style={styles.input}
			/>

			<TextInput
				label="Weight (carats)"
				value={formData.weight}
				onChangeText={(value) => updateField("weight", value)}
				keyboardType="numeric"
				style={styles.input}
			/>

			<TextInput
				label="Identification"
				value={formData.identification}
				onChangeText={(value) => updateField("identification", value)}
				style={styles.input}
			/>

			<View style={styles.dimensionsContainer}>
				<TextInput
					label="Length"
					value={formData.dimensions.length}
					onChangeText={(value) => updateDimension("length", value)}
					keyboardType="numeric"
					style={[styles.input, styles.dimensionInput]}
				/>
				<TextInput
					label="Width"
					value={formData.dimensions.width}
					onChangeText={(value) => updateDimension("width", value)}
					keyboardType="numeric"
					style={[styles.input, styles.dimensionInput]}
				/>
				<TextInput
					label="Height"
					value={formData.dimensions.height}
					onChangeText={(value) => updateDimension("height", value)}
					keyboardType="numeric"
					style={[styles.input, styles.dimensionInput]}
				/>
			</View>

			<TextInput
				label="Comments"
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
				style={styles.button}
			>
				Add Gemstone
			</Button>
		</ScrollView>
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
	dimensionsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	dimensionInput: {
		flex: 1,
		marginHorizontal: 4,
	},
	button: {
		marginTop: 8,
		marginBottom: 24,
	},
});
