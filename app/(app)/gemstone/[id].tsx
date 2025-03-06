import {
	Currency,
	CurrencySymbols,
	GemstoneColor,
	GemstoneOwner,
	GemstoneShape,
	GemstoneType,
	GemTypeEnum,
	GemTypeLabels,
} from "@/app/types/gemstone";
import { P } from "@/components/ui/typography";
import { useGemstone } from "@/hooks/useGemstone";
import { useUpdateGemstone } from "@/hooks/useUpdateGemstone";

import { GemstoneCarousel } from "@/components/Carousel";
import { GemstoneHeader } from "@/components/GemstoneHeader";
import { ComboBox } from "@/components/ui/combobox";
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
import {
	Dimensions,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
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
import { DatePickerInput } from "react-native-paper-dates";
import { Dropdown } from "react-native-paper-dropdown";
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

// Helper function to convert string to GemTypeEnum
const getGemTypeEnum = (gemType: string | null): GemTypeEnum => {
	if (!gemType) return GemTypeEnum.NATURAL;

	// Check if it's already a valid GemTypeEnum value
	if (Object.values(GemTypeEnum).includes(gemType as any)) {
		return gemType as GemTypeEnum;
	}

	// Convert legacy string values to enum
	if (gemType.toLowerCase() === "natural") return GemTypeEnum.NATURAL;
	if (gemType.toLowerCase() === "heated") return GemTypeEnum.HEATED;

	// Default fallback
	return GemTypeEnum.NATURAL;
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
	const [sellCurrency, setSellCurrency] = useState<Currency>(Currency.RMB);
	const [owner, setOwner] = useState("");
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
			setSellCurrency(Currency.RMB);
		}

		setOwner(gemstone.owner || "");
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
				sold: true,
				owner: owner,
				buyer: buyer,
				buyer_address: buyerAddress,
				comment: sellComment || gemstone.comment,
				quantity: gemstone.quantity,
			});

			setSellPrice("");
			setBuyer("");
			setBuyerAddress("");
			setSellComment("");
			setOwner("");
			setSellDialogVisible(false);

			await queryClient.invalidateQueries({ queryKey: ["gemstone"] });
			await queryClient.invalidateQueries({ queryKey: ["gemstones"] });
		} catch (error) {
			console.error("Error updating gemstone sell price:", error);
		}
	};

	return (
		<SafeAreaProvider>
			<Stack.Screen
				options={{
					title: gemstone.name,
					headerRight: () => {
						if (isEditing) {
							return (
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
							);
						}

						return (
							<View
								style={{
									flexDirection: "row",
									width: 100,
									justifyContent: "flex-end",
								}}
							>
								<IconButton
									icon="pencil"
									onPress={() => {
										setFormData({
											name: gemstone.name,
											shape: gemstone.shape,
											color: gemstone.color,
											cut: gemstone.cut,
											weight: gemstone.weight,
											quantity: gemstone.quantity || "1",
											gem_type: getGemTypeEnum(gemstone.gem_type),
											comment: gemstone.comment,
											bill_number: gemstone.bill_number,
											buy_price: gemstone.buy_price,
											sell_price: gemstone.sell_price,
											buy_currency: gemstone.buy_currency || Currency.RMB,
											sell_currency: gemstone.sell_currency || Currency.RMB,
											sold_at: gemstone.sold_at,
											buyer: gemstone.buyer,
											buyer_address: gemstone.buyer_address,
											owner: gemstone.owner,
										});
										setIsEditing(true);
									}}
								/>
							</View>
						);
					},
				}}
			/>
			<ScrollView style={[styles.container, { backgroundColor }]}>
				<View style={{ paddingBottom: 30 }}>
					<View style={styles.carouselSection}>
						{gemstone.sold && (
							<View style={styles.prominentSoldBadge}>
								<View className="bg-red-600 px-4 py-2 rounded-lg shadow-lg transform rotate-45">
									<P className="text-white font-bold text-base text-center">
										SOLD
									</P>
								</View>
							</View>
						)}
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
									<ComboBox
										label="Stone type"
										value={formData.name || ""}
										options={Object.values(GemstoneType).map((type) => ({
											label: type,
											value: type,
										}))}
										onChange={(value) =>
											setFormData((prev) => ({
												...prev,
												name: value as GemstoneType,
											}))
										}
									/>
								</View>
								<View style={styles.gemTypeContainer}>
									<View style={styles.radioGroup}>
										<TouchableOpacity
											style={[
												styles.radioCard,
												formData.gem_type === GemTypeEnum.NATURAL &&
													styles.radioCardSelected,
											]}
											onPress={() =>
												setFormData((prev) => ({
													...prev,
													gem_type: GemTypeEnum.NATURAL,
												}))
											}
											activeOpacity={0.7}
										>
											<View style={styles.radioIconContainer}>
												<View style={styles.radioOuterCircle}>
													{formData.gem_type === GemTypeEnum.NATURAL && (
														<View style={styles.radioInnerCircle} />
													)}
												</View>
											</View>
											<P
												style={
													formData.gem_type === GemTypeEnum.NATURAL
														? styles.radioTextSelected
														: styles.radioText
												}
											>
												{GemTypeLabels[GemTypeEnum.NATURAL]}
											</P>
										</TouchableOpacity>

										<TouchableOpacity
											style={[
												styles.radioCard,
												formData.gem_type === GemTypeEnum.HEATED &&
													styles.radioCardSelected,
											]}
											onPress={() =>
												setFormData((prev) => ({
													...prev,
													gem_type: GemTypeEnum.HEATED,
												}))
											}
											activeOpacity={0.7}
										>
											<View style={styles.radioIconContainer}>
												<View style={styles.radioOuterCircle}>
													{formData.gem_type === GemTypeEnum.HEATED && (
														<View style={styles.radioInnerCircle} />
													)}
												</View>
											</View>
											<P
												style={
													formData.gem_type === GemTypeEnum.HEATED
														? styles.radioTextSelected
														: styles.radioText
												}
											>
												{GemTypeLabels[GemTypeEnum.HEATED]}
											</P>
										</TouchableOpacity>
									</View>
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
									<ComboBox
										label="Shape"
										value={formData.shape || ""}
										options={Object.values(GemstoneShape).map((shape) => ({
											label: shape,
											value: shape,
										}))}
										onChange={(value) =>
											setFormData((prev) => ({
												...prev,
												shape: value as GemstoneShape,
											}))
										}
									/>
								</View>

								<View style={styles.input}>
									<ComboBox
										label="Color"
										value={formData.color || ""}
										options={Object.values(GemstoneColor).map((color) => ({
											label: color,
											value: color,
										}))}
										onChange={(value) =>
											setFormData((prev) => ({
												...prev,
												color: value as GemstoneColor,
											}))
										}
									/>
								</View>

								<View style={styles.input}>
									<ComboBox
										label="Owner"
										value={formData.owner || ""}
										options={[
											...Object.values(GemstoneOwner).map((owner) => ({
												label: owner,
												value: owner,
											})),
											// Allow free text input by adding the current value if it's not in the enum
											...(formData.owner &&
											!Object.values(GemstoneOwner).includes(
												formData.owner as any,
											)
												? [{ label: formData.owner, value: formData.owner }]
												: []),
										]}
										onChange={(value) =>
											setFormData((prev) => ({
												...prev,
												owner: value,
											}))
										}
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
									label="Quantity (pieces)"
									mode="outlined"
									value={String(formData.quantity || "1")}
									onChangeText={(value) => {
										// Only allow positive integers
										const numericValue = value.replace(/[^0-9]/g, "");
										// Ensure at least 1
										const finalValue = numericValue === "" ? "1" : numericValue;
										setFormData((prev) => ({
											...prev,
											quantity: finalValue,
										}));
									}}
									keyboardType="number-pad"
									style={styles.input}
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
														? CurrencySymbols[formData.buy_currency as Currency]
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
											menuContentStyle={{ top: -40 }}
											value={formData.buy_currency || Currency.RMB}
											options={Object.values(Currency).map((currency) => ({
												label: currency,
												value: currency,
											}))}
											onSelect={(value) =>
												setFormData((prev) => ({
													...prev,
													buy_currency: value as Currency,
												}))
											}
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
											menuContentStyle={{ top: -40 }}
											value={formData.sell_currency || Currency.RMB}
											options={Object.values(Currency).map((currency) => ({
												label: currency,
												value: currency,
											}))}
											onSelect={(value) =>
												setFormData((prev) => ({
													...prev,
													sell_currency: value as Currency,
												}))
											}
										/>
									</View>
								</View>
								<View style={styles.input}>
									<DatePickerInput
										locale="en"
										label="Sold date"
										value={
											formData.sold_at ? new Date(formData.sold_at) : undefined
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
							<View style={styles.tableContainer}>
								<GemstoneHeader
									name={gemstone.name}
									shape={gemstone.shape as GemstoneShape}
									color={gemstone.color as GemstoneColor}
									gemType={getGemTypeEnum(gemstone.gem_type)}
								/>

								<View style={styles.tableHeader}>
									<P style={styles.tableHeaderText}>Property</P>
									<P style={styles.tableHeaderText}>Value</P>
								</View>

								<View style={styles.tableRow}>
									<View style={styles.tableCell}>
										<P style={styles.tableCellLabel}>Bill number</P>
									</View>
									<View style={styles.tableCell}>
										<P style={styles.tableCellValue}>{gemstone.bill_number}</P>
									</View>
								</View>

								<View style={styles.tableRow}>
									<View style={styles.tableCell}>
										<P style={styles.tableCellLabel}>Owner</P>
									</View>
									<View style={styles.tableCell}>
										<P style={styles.tableCellValue}>{gemstone.owner || ""}</P>
									</View>
								</View>

								<View style={styles.tableRow}>
									<View style={styles.tableCell}>
										<P style={styles.tableCellLabel}>Weight</P>
									</View>
									<View style={styles.tableCell}>
										<P style={styles.tableCellValue}>
											{gemstone.weight} carats
										</P>
									</View>
								</View>

								<View style={styles.tableRow}>
									<View style={styles.tableCell}>
										<P style={styles.tableCellLabel}>Quantity</P>
									</View>
									<View style={styles.tableCell}>
										<P style={styles.tableCellValue}>
											{gemstone.quantity || "1"} pieces
										</P>
									</View>
								</View>

								<View style={styles.tableRow}>
									<View style={styles.tableCell}>
										<P style={styles.tableCellLabel}>Buy price</P>
									</View>
									<View style={styles.tableCell}>
										<P style={styles.tableCellValue}>
											{getCurrencySymbol(gemstone.buy_currency)}
											{gemstone.buy_price || 0}
										</P>
									</View>
								</View>

								<View style={styles.tableRow}>
									<View style={styles.tableCell}>
										<P style={styles.tableCellLabel}>Sell price</P>
									</View>
									<View style={styles.tableCell}>
										<P style={styles.tableCellValue}>
											{getCurrencySymbol(gemstone.sell_currency)}
											{gemstone.sell_price || 0}
										</P>
									</View>
								</View>

								{gemstone.sold_at && (
									<View style={styles.tableRow}>
										<View style={styles.tableCell}>
											<P style={styles.tableCellLabel}>Sold At</P>
										</View>
										<View style={styles.tableCell}>
											<P style={styles.tableCellValue}>
												{formatDate(gemstone.sold_at)}
											</P>
										</View>
									</View>
								)}

								{gemstone.buyer && (
									<View style={styles.tableRow}>
										<View style={styles.tableCell}>
											<P style={styles.tableCellLabel}>Buyer</P>
										</View>
										<View style={styles.tableCell}>
											<P style={styles.tableCellValue}>{gemstone.buyer}</P>
										</View>
									</View>
								)}

								{gemstone.buyer_address && (
									<View style={styles.tableRow}>
										<View style={styles.tableCell}>
											<P style={styles.tableCellLabel}>Buyer Address</P>
										</View>
										<View style={styles.tableCell}>
											<P style={styles.tableCellValue}>
												{gemstone.buyer_address}
											</P>
										</View>
									</View>
								)}

								<View style={styles.tableRow}>
									<View style={styles.tableCell}>
										<P style={styles.tableCellLabel}>Comments</P>
									</View>
									<View style={styles.tableCell}>
										<P style={styles.tableCellValue}>{gemstone.comment}</P>
									</View>
								</View>
							</View>
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
								left={<TextInput.Affix text={CurrencySymbols[sellCurrency]} />}
							/>
							<View style={styles.currencyDropdown}>
								<Dropdown
									label="Currency"
									mode="outlined"
									hideMenuHeader
									menuContentStyle={{ top: -40 }}
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
	prominentSoldBadge: {
		position: "absolute",
		top: 10,
		right: 10,
		zIndex: 10,
		width: 70,
		height: 70,
		justifyContent: "center",
		alignItems: "center",
		overflow: "visible",
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
		gap: 8,
	},
	detailRow: {
		flexDirection: "row",
		gap: 8,
	},
	label: {
		fontSize: 20,
		fontWeight: "bold",
	},
	textValue: {
		fontSize: 20,
	},
	input: {
		marginBottom: 8,
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
	quantityDisplay: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	quantityLabel: {
		fontWeight: "bold",
	},
	quantityValue: {
		marginLeft: 8,
	},
	gemTypeContainer: {
		marginBottom: 16,
	},
	gemTypeLabel: {
		fontWeight: "bold",
		marginBottom: 8,
		fontSize: 16,
	},
	radioGroup: {
		flexDirection: "row",
		gap: 16,
	},
	radioCard: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	radioCardSelected: {
		borderColor: "#6200EE",
		borderWidth: 1,
		backgroundColor: "#F4EAFF",
	},
	radioIconContainer: {
		marginRight: 10,
	},
	radioOuterCircle: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#6200EE",
		justifyContent: "center",
		alignItems: "center",
	},
	radioInnerCircle: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: "#6200EE",
	},
	radioText: {
		fontSize: 16,
	},
	radioTextSelected: {
		fontWeight: "bold",
		color: "#6200EE",
	},
	tableContainer: {
		borderRadius: 8,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "#e0e0e0",
		marginBottom: 16,
	},
	tableHeader: {
		flexDirection: "row",
		backgroundColor: "#f5f5f5",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
	},
	tableHeaderText: {
		fontSize: 16,
		fontWeight: "bold",
		flex: 1,
		color: "#333",
	},
	tableRow: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
	},
	tableCell: {
		flex: 1,
		padding: 12,
		justifyContent: "center",
	},
	tableCellLabel: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#555",
	},
	tableCellValue: {
		fontSize: 16,
		color: "#333",
	},
});
