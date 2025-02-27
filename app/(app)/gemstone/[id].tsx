import {
	GemstoneColor,
	GemstoneCut,
	GemstoneShape,
} from "@/app/types/gemstone";
import { H3, P } from "@/components/ui/typography";
import { useGemstone } from "@/hooks/useGemstone";
import { useUpdateGemstone } from "@/hooks/useUpdateGemstone";

import { OptimizedImage } from "@/components/OptimizedImage";
import { useSupabase } from "@/context/supabase-provider";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Tables } from "@/lib/database.types";
import { getDefaultStoneImage } from "@/lib/imageUtils";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import {
	ActivityIndicator,
	Button,
	IconButton,
	PaperProvider,
	TextInput,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

export default function GemstoneDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { data: gemstone, isLoading } = useGemstone(id);
	const updateGemstone = useUpdateGemstone();
	const { activeOrganization, session } = useSupabase();
	const queryClient = useQueryClient();

	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<Partial<Tables<"stones">>>({});
	const [tempImagePreviews, setTempImagePreviews] = useState<
		ImagePicker.ImagePickerAsset[]
	>([]);

	const { uploading, takePhoto, pickImage } = useImageUpload(
		`${activeOrganization?.id}/${gemstone?.id}`,
	);

	const handlePickImage = async () => {
		await pickImage({
			setTempImagePreviews,
		});

		// Invalidate the cache after successful upload
		await queryClient.invalidateQueries({ queryKey: ["gemstone", id] });
		await queryClient.invalidateQueries({ queryKey: ["gemstones"] });
	};

	if (isLoading || !gemstone) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	const handleSave = async () => {
		try {
			await updateGemstone.mutateAsync({
				id: gemstone.id,
				...formData,
			});
			setIsEditing(false);
		} catch (error) {
			console.error("Error updating gemstone:", error);
		}
	};

	return (
		<PaperProvider>
			<Stack.Screen
				options={{
					title: gemstone.name,
					headerRight: () =>
						isEditing ? (
							<View style={{ flexDirection: "row" }}>
								<IconButton
									icon="close"
									onPress={() => {
										setIsEditing(false);
										setFormData({});
									}}
								/>
								<IconButton
									icon="check"
									onPress={handleSave}
									loading={updateGemstone.isPending}
								/>
							</View>
						) : (
							<IconButton
								icon="pencil"
								onPress={() => {
									setFormData({
										name: gemstone.name,
										shape: gemstone.shape,
										color: gemstone.color,
										cut: gemstone.cut,
										weight: gemstone.weight,
										identification: gemstone.identification,
										comment: gemstone.comment,
									});
									setIsEditing(true);
								}}
							/>
						),
				}}
			/>
			<ScrollView style={styles.container}>
				<ScrollView
					horizontal
					style={styles.imageScroll}
					contentContainerStyle={styles.imageContainer}
				>
					{(gemstone.images || []).map((image) => (
						<OptimizedImage
							key={image.id}
							image={image}
							placeholder={getDefaultStoneImage()}
							style={styles.image}
						/>
					))}
					{tempImagePreviews.map((preview, index) => (
						<Image
							key={`preview-${index}`}
							source={{ uri: preview.uri }}
							style={[styles.image, { opacity: 0.7 }]}
							resizeMode="cover"
						/>
					))}

					<Button
						mode="outlined"
						onPress={handlePickImage}
						loading={uploading}
						style={styles.addImageButton}
					>
						Add Image
					</Button>
				</ScrollView>

				<View style={styles.detailsContainer}>
					{isEditing ? (
						<>
							<TextInput
								label="Name"
								mode="outlined"
								value={formData.name}
								onChangeText={(value) =>
									setFormData((prev) => ({ ...prev, name: value }))
								}
								style={styles.input}
							/>

							<View style={styles.input}>
								<Dropdown
									label="Shape"
									mode="outlined"
									hideMenuHeader
									menuContentStyle={{ top: -50 }}
									value={formData.shape || undefined}
									onSelect={(value) =>
										setFormData((prev) => ({ ...prev, shape: value }))
									}
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
									value={formData.color || undefined}
									onSelect={(value) =>
										setFormData((prev) => ({ ...prev, color: value }))
									}
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
									value={formData.cut || undefined}
									onSelect={(value) =>
										setFormData((prev) => ({ ...prev, cut: value }))
									}
									options={Object.values(GemstoneCut).map((cut) => ({
										label: cut,
										value: cut,
									}))}
								/>
							</View>

							<TextInput
								label="Weight (carats)"
								mode="outlined"
								value={String(formData.weight || "")}
								onChangeText={(value) =>
									setFormData((prev) => ({
										...prev,
										weight: value ? parseFloat(value) : null,
									}))
								}
								keyboardType="decimal-pad"
								style={styles.input}
							/>

							<TextInput
								label="Identification"
								mode="outlined"
								value={formData.identification || ""}
								onChangeText={(value) =>
									setFormData((prev) => ({ ...prev, identification: value }))
								}
								style={styles.input}
							/>

							<TextInput
								label="Comments"
								mode="outlined"
								value={formData.comment || ""}
								onChangeText={(value) =>
									setFormData((prev) => ({ ...prev, comment: value }))
								}
								multiline
								numberOfLines={3}
								style={[styles.input, { height: 100 }]}
							/>
						</>
					) : (
						<>
							<View style={styles.detailRow}>
								<P style={styles.label}>Shape:</P>
								<P>{gemstone.shape}</P>
							</View>
							<View style={styles.detailRow}>
								<P style={styles.label}>Color:</P>
								<P>{gemstone.color}</P>
							</View>
							<View style={styles.detailRow}>
								<P style={styles.label}>Cut:</P>
								<P>{gemstone.cut}</P>
							</View>
							<View style={styles.detailRow}>
								<P style={styles.label}>Weight:</P>
								<P>{gemstone.weight} carats</P>
							</View>
							<View style={styles.detailRow}>
								<P style={styles.label}>Identification:</P>
								<P>{gemstone.identification}</P>
							</View>
							<View style={styles.detailRow}>
								<P style={styles.label}>Comments:</P>
								<P>{gemstone.comment}</P>
							</View>
						</>
					)}

					<View style={styles.certificateSection}>
						<H3>Certificate</H3>
						{gemstone.certificate_id ? (
							<Button
								mode="contained"
								onPress={() => {
									// Open certificate URL
									// Linking.openURL(gemstone.certificate_id);
								}}
							>
								View Certificate
							</Button>
						) : (
							<Button mode="outlined" onPress={() => {}} loading={false}>
								Upload Certificate
							</Button>
						)}
					</View>
				</View>
			</ScrollView>
		</PaperProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 16,
	},
	headerButtons: {
		flexDirection: "row",
		alignItems: "center",
	},
	imageScroll: {
		maxHeight: 200,
	},
	imageContainer: {
		padding: 16,
		gap: 16,
	},
	image: {
		width: 150,
		height: 150,
		borderRadius: 8,
	},
	addImageButton: {
		height: 150,
		justifyContent: "center",
	},
	detailsContainer: {
		padding: 16,
		gap: 16,
	},
	detailRow: {
		flexDirection: "row",
		gap: 8,
	},
	label: {
		fontWeight: "bold",
	},
	input: {
		marginBottom: 16,
	},
	certificateSection: {
		marginTop: 24,
		gap: 16,
	},
});
