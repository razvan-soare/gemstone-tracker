import {
	GemstoneColor,
	GemstoneCut,
	GemstoneShape,
} from "@/app/types/gemstone";
import { P } from "@/components/ui/typography";
import { useGemstone } from "@/hooks/useGemstone";
import { useUpdateGemstone } from "@/hooks/useUpdateGemstone";

import { GemstoneCarousel } from "@/components/Carousel";
import { colors } from "@/constants/colors";
import { useSupabase } from "@/context/supabase-provider";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Tables } from "@/lib/database.types";
import { useColorScheme } from "@/lib/useColorScheme";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import {
	ActivityIndicator,
	Button,
	Dialog,
	FAB,
	IconButton,
	PaperProvider,
	Portal,
	TextInput,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

export default function GemstoneDetail() {
	const { showActionSheetWithOptions } = useActionSheet();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { data: gemstone, isLoading } = useGemstone(id);
	const updateGemstone = useUpdateGemstone();
	const { activeOrganization } = useSupabase();
	const queryClient = useQueryClient();
	const screenWidth = Dimensions.get("window").width;
	const { colorScheme } = useColorScheme();
	const backgroundColor =
		colorScheme === "dark" ? colors.dark.background : colors.light.background;

	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<Partial<Tables<"stones">>>({});
	const [tempImagePreviews, setTempImagePreviews] = useState<
		ImagePicker.ImagePickerAsset[]
	>([]);
	const [sellDialogVisible, setSellDialogVisible] = useState(false);
	const [sellPrice, setSellPrice] = useState("");

	const { uploading, takePhoto, pickImage } = useImageUpload(
		`${activeOrganization?.id}/${gemstone?.id}`,
	);

	const handleTakePhoto = async () => {
		await takePhoto({
			setTempImagePreviews,
		});

		// Invalidate the cache after successful upload
		await queryClient.invalidateQueries({ queryKey: ["gemstone"] });
		await queryClient.invalidateQueries({ queryKey: ["gemstones"] });
	};
	const handlePickImage = async () => {
		await pickImage({
			setTempImagePreviews,
		});

		// Invalidate the cache after successful upload
		await queryClient.invalidateQueries({ queryKey: ["gemstone"] });
		await queryClient.invalidateQueries({ queryKey: ["gemstones"] });
	};

	const onOpenAddPicture = () => {
		const options = ["Take picture", "Upload picture", "Cancel"];
		const cancelButtonIndex = 2;

		showActionSheetWithOptions(
			{
				options,
				cancelButtonIndex,
			},
			(selectedIndex: number | undefined) => {
				switch (selectedIndex) {
					case 0:
						handleTakePhoto();
						break;

					case 1:
						handlePickImage();
						break;

					case cancelButtonIndex:
					// Canceled
				}
			},
		);
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

	const onSellStone = () => {
		setSellDialogVisible(true);
	};

	const handleSellConfirm = async () => {
		try {
			const price = parseFloat(sellPrice);
			if (isNaN(price) || price <= 0) {
				// Handle invalid price input
				return;
			}

			await updateGemstone.mutateAsync({
				id: gemstone.id,
				sell_price: price,
				sold_at: new Date().toISOString(),
			});

			// Reset state and close dialog
			setSellPrice("");
			setSellDialogVisible(false);

			// Invalidate queries to refresh data
			await queryClient.invalidateQueries({ queryKey: ["gemstone"] });
			await queryClient.invalidateQueries({ queryKey: ["gemstones"] });
		} catch (error) {
			console.error("Error updating gemstone sell price:", error);
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
										code: gemstone.code,
										buy_price: gemstone.buy_price,
										sell_price: gemstone.sell_price,
									});
									setIsEditing(true);
								}}
							/>
						),
				}}
			/>
			<ScrollView style={[styles.container, { backgroundColor }]}>
				<View style={styles.carouselSection}>
					<GemstoneCarousel
						images={gemstone.images || []}
						tempImagePreviews={tempImagePreviews}
						height={200}
						width={screenWidth}
					/>
				</View>

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
							<TextInput
								label="Code"
								mode="outlined"
								value={formData.code || ""}
								onChangeText={(value) =>
									setFormData((prev) => ({ ...prev, code: value }))
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
							<TextInput
								label="Buy price"
								mode="outlined"
								value={String(formData.buy_price || "")}
								onChangeText={(value) =>
									setFormData((prev) => ({
										...prev,
										buy_price: value ? parseFloat(value) : null,
									}))
								}
								keyboardType="decimal-pad"
								style={[styles.input]}
							/>
							<TextInput
								label="Sell price"
								mode="outlined"
								value={String(formData.sell_price || "")}
								onChangeText={(value) =>
									setFormData((prev) => ({
										...prev,
										sell_price: value ? parseFloat(value) : null,
									}))
								}
								keyboardType="decimal-pad"
								style={[styles.input]}
							/>
						</>
					) : (
						<>
							<View style={styles.detailRow}>
								<P style={styles.label}>Code:</P>
								<P>{gemstone.code}</P>
							</View>
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
							<View style={styles.detailRow}>
								<P style={styles.label}>Buy price:</P>
								<P>${gemstone.buy_price}</P>
							</View>

							{gemstone.sell_price && (
								<View style={styles.detailRow}>
									<P style={styles.label}>Sell Price:</P>
									<P>${gemstone.sell_price}</P>
								</View>
							)}
							{gemstone.sold_at && (
								<View style={styles.detailRow}>
									<P style={styles.label}>Sold At:</P>
									<P>{new Date(gemstone.sold_at).toLocaleDateString()}</P>
								</View>
							)}
						</>
					)}
				</View>
			</ScrollView>

			{/* Sell Dialog */}
			<Portal>
				<Dialog
					visible={sellDialogVisible}
					onDismiss={() => setSellDialogVisible(false)}
				>
					<Dialog.Title>Sell Gemstone</Dialog.Title>
					<Dialog.Content>
						<TextInput
							label="Sell Price ($)"
							value={sellPrice}
							onChangeText={setSellPrice}
							keyboardType="decimal-pad"
							mode="outlined"
							style={{ marginTop: 10 }}
						/>
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setSellDialogVisible(false)}>Cancel</Button>
						<Button
							onPress={handleSellConfirm}
							loading={updateGemstone.isPending}
						>
							Confirm
						</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>

			<FAB
				icon="plus"
				style={styles.fab}
				onPress={onOpenAddPicture}
				loading={uploading}
			/>
			<FAB
				icon="currency-usd"
				style={styles.fabSell}
				onPress={onSellStone}
				loading={updateGemstone.isPending}
			/>
		</PaperProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: "relative",
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
	carouselSection: {
		paddingHorizontal: 0,
	},
	addImageButton: {
		marginTop: 16,
		alignSelf: "center",
		width: "50%",
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
	fab: {
		position: "absolute",
		margin: 16,
		right: 0,
		bottom: 50,
		width: 56,
		height: 56,
		borderRadius: 100,
	},
	fabSell: {
		position: "absolute",
		margin: 16,
		right: 0,
		bottom: 130,
		width: 56,
		height: 56,
		borderRadius: 100,
	},
});
