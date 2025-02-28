import {
	GemstoneColor,
	GemstoneCut,
	GemstoneShape,
	GemstoneType,
	Currency,
	CurrencySymbols,
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

// Helper function to safely get currency symbol
const getCurrencySymbol = (currencyCode: string | null): string => {
	if (!currencyCode) return "$";

	// Check if the currency code is a valid Currency enum value
	const isValidCurrency = Object.values(Currency).includes(currencyCode as any);
	if (isValidCurrency) {
		return CurrencySymbols[currencyCode as Currency];
	}

	return "$"; // Default fallback
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
	const [sellCurrency, setSellCurrency] = useState<Currency>(Currency.USD);
	const [buyer, setBuyer] = useState("");
	const [buyerAddress, setBuyerAddress] = useState("");
	const [sellComment, setSellComment] = useState("");

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
		// Prepopulate fields with existing values if available
		setSellPrice(gemstone.sell_price ? String(gemstone.sell_price) : "");

		// Handle the currency type safely
		if (
			gemstone.sell_currency &&
			Object.values(Currency).includes(gemstone.sell_currency as any)
		) {
			setSellCurrency(gemstone.sell_currency as Currency);
		} else {
			setSellCurrency(Currency.USD);
		}

		setBuyer(gemstone.buyer || "");
		setBuyerAddress(gemstone.buyer_address || "");
		setSellComment(gemstone.comment || "");
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
				sell_currency: sellCurrency,
				sold_at: utcDate.toISOString(),
				buyer: buyer,
				buyer_address: buyerAddress,
				comment: sellComment || gemstone.comment,
			});

			setSellPrice("");
			setSellCurrency(Currency.USD);
			setBuyer("");
			setBuyerAddress("");
			setSellComment("");
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
											buy_currency: gemstone.buy_currency || Currency.USD,
											sell_currency: gemstone.sell_currency || Currency.USD,
											sold_at: gemstone.sold_at,
											buyer: gemstone.buyer,
											buyer_address: gemstone.buyer_address,
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
									<View style={styles.priceContainer}>
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
											style={styles.priceInput}
											left={
												<TextInput.Affix
													text={
														formData.buy_currency &&
														typeof formData.buy_currency === "string" &&
														Object.values(Currency).includes(
															formData.buy_currency as any,
														)
															? CurrencySymbols[
																	formData.buy_currency as Currency
																]
															: "$"
													}
												/>
											}
										/>
										<View style={styles.currencyDropdown}>
											<Dropdown
												label="Currency"
												mode="outlined"
												hideMenuHeader
												menuContentStyle={{ top: -95, left: -8 }}
												value={formData.buy_currency || Currency.USD}
												onSelect={(value) =>
													setFormData((prev) => ({
														...prev,
														buy_currency: value,
													}))
												}
												options={Object.values(Currency).map((currency) => ({
													label: currency,
													value: currency,
												}))}
											/>
										</View>
									</View>
									<View style={styles.priceContainer}>
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
											style={styles.priceInput}
											left={
												<TextInput.Affix
													text={
														formData.sell_currency &&
														typeof formData.sell_currency === "string" &&
														Object.values(Currency).includes(
															formData.sell_currency as any,
														)
															? CurrencySymbols[
																	formData.sell_currency as Currency
																]
															: "$"
													}
												/>
											}
											placeholder="Set price without marking as sold"
										/>
										<View style={styles.currencyDropdown}>
											<Dropdown
												label="Currency"
												mode="outlined"
												hideMenuHeader
												menuContentStyle={{ top: -95, left: -8 }}
												value={formData.sell_currency || Currency.USD}
												onSelect={(value) =>
													setFormData((prev) => ({
														...prev,
														sell_currency: value,
													}))
												}
												options={Object.values(Currency).map((currency) => ({
													label: currency,
													value: currency,
												}))}
											/>
										</View>
									</View>
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
										<>
											<TextInput
												label="Buyer"
												mode="outlined"
												value={formData.buyer || ""}
												onChangeText={(value) =>
													setFormData((prev) => ({ ...prev, buyer: value }))
												}
												style={styles.input}
											/>
											<TextInput
												label="Buyer Address"
												mode="outlined"
												value={formData.buyer_address || ""}
												onChangeText={(value) =>
													setFormData((prev) => ({
														...prev,
														buyer_address: value,
													}))
												}
												style={styles.input}
											/>
										</>
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
										<P>
											{getCurrencySymbol(gemstone.buy_currency)}
											{gemstone.buy_price || 0}
										</P>
									</View>

									<View style={styles.detailRow}>
										<P style={styles.label}>Sell price:</P>
										<P>
											{getCurrencySymbol(gemstone.sell_currency)}
											{gemstone.sell_price || 0}
										</P>
									</View>

									{gemstone.sold_at && (
										<View style={styles.detailRow}>
											<P style={styles.label}>Sold At:</P>
											<P>{formatDate(gemstone.sold_at)}</P>
										</View>
									)}
									{gemstone.buyer && (
										<View style={styles.detailRow}>
											<P style={styles.label}>Buyer:</P>
											<P>{gemstone.buyer}</P>
										</View>
									)}
									{gemstone.buyer_address && (
										<View style={styles.detailRow}>
											<P style={styles.label}>Buyer Address:</P>
											<P>{gemstone.buyer_address}</P>
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
							<View style={styles.priceContainer}>
								<TextInput
									label="Sell Price"
									defaultValue={sellPrice}
									onChangeText={setSellPrice}
									keyboardType="decimal-pad"
									mode="outlined"
									style={styles.priceInput}
									left={
										<TextInput.Affix text={CurrencySymbols[sellCurrency]} />
									}
								/>
								<View style={styles.currencyDropdown}>
									<Dropdown
										label="Currency"
										mode="outlined"
										hideMenuHeader
										menuContentStyle={{ top: -95, left: -15 }}
										value={sellCurrency}
										onSelect={(value) => setSellCurrency(value as Currency)}
										options={Object.values(Currency).map((currency) => ({
											label: currency,
											value: currency,
										}))}
									/>
								</View>
							</View>
							<TextInput
								label="Buyer"
								defaultValue={buyer}
								onChangeText={setBuyer}
								mode="outlined"
								style={{ marginBottom: 10 }}
							/>
							<TextInput
								label="Buyer Address"
								defaultValue={buyerAddress}
								onChangeText={setBuyerAddress}
								mode="outlined"
								style={{ marginBottom: 10 }}
							/>
							<TextInput
								label="Comment"
								defaultValue={sellComment}
								onChangeText={setSellComment}
								mode="outlined"
								multiline
								numberOfLines={3}
								style={{ height: 80 }}
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
