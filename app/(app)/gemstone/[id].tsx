import {
	GemstoneColor,
	GemstoneCut,
	GemstoneShape,
	GemstoneType,
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
import { DatePickerInput } from "react-native-paper-dates";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Helper function to format dates consistently
const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	// Create a date object that ignores timezone
	return new Date(
		date.getUTCFullYear(),
		date.getUTCMonth(),
		date.getUTCDate(),
	).toLocaleDateString();
};

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

		await queryClient.invalidateQueries({ queryKey: ["gemstone"] });
		await queryClient.invalidateQueries({ queryKey: ["gemstones"] });
	};
	const handlePickImage = async () => {
		await pickImage({
			setTempImagePreviews,
		});

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
			// Create update object
			const updateData = { ...formData };

			// If we're updating sell_price but the item isn't sold yet,
			// make sure we don't accidentally mark it as sold
			if (updateData.sell_price !== undefined && !updateData.sold_at) {
				// Ensure sold_at remains null
				updateData.sold_at = null;
			}

			// If sold_at is being set to null, make sure it's explicitly included in the update
			if (formData.sold_at === null) {
				updateData.sold_at = null;
			}

			await updateGemstone.mutateAsync({
				id: gemstone.id,
				...updateData,
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
				return;
			}

			// Create a date at noon UTC to avoid timezone issues
			const today = new Date();
			const utcDate = new Date(
				Date.UTC(
					today.getFullYear(),
					today.getMonth(),
					today.getDate(),
					12,
					0,
					0,
				),
			);

			await updateGemstone.mutateAsync({
				id: gemstone.id,
				sell_price: price,
				sold_at: utcDate.toISOString(),
			});

			setSellPrice("");
			setSellDialogVisible(false);

			await queryClient.invalidateQueries({ queryKey: ["gemstone"] });
			await queryClient.invalidateQueries({ queryKey: ["gemstones"] });
		} catch (error) {
			console.error("Error updating gemstone sell price:", error);
		}
	};

	return (
		<SafeAreaProvider>
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
											bill_number: gemstone.bill_number,
											buy_price: gemstone.buy_price,
											sell_price: gemstone.sell_price,
											sold_at: gemstone.sold_at,
										});
										setIsEditing(true);
									}}
								/>
							),
					}}
				/>
				<ScrollView style={[styles.container, { backgroundColor }]}>
					<View style={{ paddingBottom: 30 }}>
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
									<View style={styles.input}>
										<Dropdown
											label="Stone type"
											mode="outlined"
											hideMenuHeader
											menuContentStyle={{ top: -35 }}
											value={formData.name || undefined}
											onSelect={(value) =>
												setFormData((prev) => ({ ...prev, name: value }))
											}
											options={Object.values(GemstoneType).map((type) => ({
												label: type,
												value: type,
											}))}
										/>
									</View>
									<TextInput
										label="Bill number"
										mode="outlined"
										value={formData.bill_number || ""}
										onChangeText={(value) =>
											setFormData((prev) => ({ ...prev, bill_number: value }))
										}
										style={styles.input}
									/>

									<View style={styles.input}>
										<Dropdown
											label="Shape"
											mode="outlined"
											hideMenuHeader
											menuContentStyle={{ top: -35 }}
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
											menuContentStyle={{ top: -35 }}
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
											menuContentStyle={{ top: -35 }}
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
											setFormData((prev) => ({
												...prev,
												identification: value,
											}))
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
										label="Buy price ($)"
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
										label="Sell price ($)"
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
										placeholder="Set price without marking as sold"
									/>
									<View style={styles.input}>
										<DatePickerInput
											locale="en"
											label="Sold date"
											value={
												formData.sold_at
													? new Date(formData.sold_at)
													: undefined
											}
											onChange={(date) => {
												if (date) {
													// Create a date at noon UTC to avoid timezone issues
													const utcDate = new Date(
														Date.UTC(
															date.getFullYear(),
															date.getMonth(),
															date.getDate(),
															12,
															0,
															0,
														),
													);
													setFormData((prev) => ({
														...prev,
														sold_at: utcDate.toISOString(),
													}));
												} else {
													setFormData((prev) => ({
														...prev,
														sold_at: null,
													}));
												}
											}}
											inputMode="start"
											mode="outlined"
											presentationStyle="pageSheet"
											withDateFormatInLabel={false}
										/>
									</View>
									{formData.sold_at && (
										<Button
											mode="outlined"
											onPress={() =>
												setFormData((prev) => ({
													...prev,
													sold_at: null,
												}))
											}
											style={styles.input}
										>
											Clear Sold Date
										</Button>
									)}
								</>
							) : (
								<>
									<View style={styles.detailRow}>
										<P style={styles.label}>Bill number:</P>
										<P>{gemstone.bill_number}</P>
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
										<P>${gemstone.buy_price || 0}</P>
									</View>

									<View style={styles.detailRow}>
										<P style={styles.label}>Sell price:</P>
										<P>${gemstone.sell_price || 0}</P>
									</View>

									{gemstone.sold_at && (
										<View style={styles.detailRow}>
											<P style={styles.label}>Sold At:</P>
											<P>{formatDate(gemstone.sold_at)}</P>
										</View>
									)}
								</>
							)}
						</View>
					</View>
				</ScrollView>

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
							<Button onPress={() => setSellDialogVisible(false)}>
								Cancel
							</Button>
							<Button
								onPress={handleSellConfirm}
								loading={updateGemstone.isPending}
							>
								Confirm
							</Button>
						</Dialog.Actions>
					</Dialog>
				</Portal>
				{!isEditing && (
					<>
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
					</>
				)}
			</PaperProvider>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: "relative",
		paddingBottom: 100,
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
