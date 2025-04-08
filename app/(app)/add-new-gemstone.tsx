import {
	Currency,
	CurrencySymbols,
	GemstoneOwner,
	GemTreatmentEnum,
	GemTreatmentLabels,
} from "@/app/types/gemstone";
import { ComboBox } from "@/components/ui/combobox";
import { H3, P } from "@/components/ui/typography";
import { colors } from "@/constants/colors";
import { useSupabase } from "@/context/supabase-provider";
import { useCreateGemstone } from "@/hooks/useCreateGemstone";
import { useLanguage } from "@/hooks/useLanguage";
import { useOrganizationColors } from "@/hooks/useOrganizationColors";
import { useOrganizationGemstoneTypes } from "@/hooks/useOrganizationGemstoneTypes";
import { useOrganizationOwners } from "@/hooks/useOrganizationOwners";
import { useOrganizationShapes } from "@/hooks/useOrganizationShapes";
import { uploadFiles } from "@/lib/tus";
import { useColorScheme } from "@/lib/useColorScheme";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	Image,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
import {
	Button,
	IconButton,
	MD2Colors,
	Snackbar,
	TextInput,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DatePickerField } from "@/components/DatePickerField";

// Register the English locale

// Key for storing owner preference
const LAST_SELECTED_OWNER_KEY = "lastSelectedOwner";

type ValidationError = {
	field: string;
	message: string;
};

export default function AddNewGemstone() {
	const { t } = useLanguage();
	const { activeOrganization } = useSupabase();
	const createGemstone = useCreateGemstone();
	const [error, setError] = useState<ValidationError | null>(null);
	const { colorScheme } = useColorScheme();
	const backgroundColor =
		colorScheme === "dark" ? colors.dark.background : colors.light.background;
	const [selectedImages, setSelectedImages] = useState<
		ImagePicker.ImagePickerAsset[]
	>([]);
	const [isUploadingImages, setIsUploadingImages] = useState(false);
	// Flag to track if initial owner loading is complete
	const [ownerLoaded, setOwnerLoaded] = useState(false);

	const queryClient = useQueryClient();

	const { owners, addOwner } = useOrganizationOwners();
	const { gemstoneTypes, addGemstoneType } = useOrganizationGemstoneTypes();
	const { shapes, addShape } = useOrganizationShapes();
	const { colors: orgColors, addColor } = useOrganizationColors();

	const [formData, setFormData] = useState({
		name: "",
		bill_number: "",
		shape: "",
		color: "",
		cut: "",
		weight: "",
		quantity: "1",
		gem_treatment: GemTreatmentEnum.NATURAL,
		comment: "",
		date: new Date().toISOString().split("T")[0],
		dimensions: { length: "", width: "", height: "" },
		buy_price: "",
		sell_price: "",
		buy_currency: Currency.LKR,
		sell_currency: Currency.RMB,
		purchase_date: new Date().toISOString().split("T")[0],
		sold_at: null as string | null,
		buyer: "",
		buyer_address: "",
		owner: "",
	});

	// Load the last selected owner when component mounts or owners change
	useEffect(() => {
		if (owners.length === 0) return;

		const loadLastSelectedOwner = async () => {
			try {
				const savedOwner = await AsyncStorage.getItem(LAST_SELECTED_OWNER_KEY);

				// Check if savedOwner exists in the current organization's owners list
				const ownerExists =
					savedOwner && owners.some((owner) => owner.name === savedOwner);

				if (ownerExists) {
					// Use the saved owner if it exists in the current organization
					setFormData((prev) => ({
						...prev,
						owner: savedOwner,
					}));
				} else if (owners.length > 0) {
					// Otherwise use the first owner as default if available
					setFormData((prev) => ({
						...prev,
						owner: owners[0].name,
					}));

					// Update the saved preference to the first owner
					AsyncStorage.setItem(LAST_SELECTED_OWNER_KEY, owners[0].name);
				}
			} catch (error) {
				console.error("Error loading last selected owner:", error);

				// Fallback to first owner on error
				if (owners.length > 0) {
					setFormData((prev) => ({
						...prev,
						owner: owners[0].name,
					}));
				}
			} finally {
				setOwnerLoaded(true);
			}
		};

		loadLastSelectedOwner();
	}, [owners]);

	const updateField = (field: string, value?: string | GemTreatmentEnum) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));

		// Save owner preference when it changes
		if (field === "owner" && value) {
			try {
				AsyncStorage.setItem(LAST_SELECTED_OWNER_KEY, value as string);
			} catch (error) {
				console.error("Error saving owner preference:", error);
			}
		}
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
				message: t("gemstones.noOrganization"),
			};
		}

		if (!formData.name.trim()) {
			return {
				field: "name",
				message: t("gemstones.stoneType") + " " + t("common.error"),
			};
		}

		if (formData.weight && isNaN(parseFloat(formData.weight))) {
			return {
				field: "weight",
				message: t("gemstones.weight") + " " + t("common.error"),
			};
		}

		if (
			!formData.quantity ||
			isNaN(parseInt(formData.quantity)) ||
			parseInt(formData.quantity) < 1
		) {
			return {
				field: "quantity",
				message: t("gemstones.quantityPieces") + " " + t("common.error"),
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
			return;
		}

		if (!activeOrganization) {
			return;
		}

		try {
			// Create the gemstone first
			const gemstone = await createGemstone.mutateAsync({
				...formData,
				organization_id: activeOrganization.id,
				pictures: [],
				weight: formData.weight ? parseFloat(formData.weight) : null,
				dimensions: Object.values(formData.dimensions).some((v) => v)
					? formData.dimensions
					: null,
				purchase_date: formData.purchase_date || null,
				sold_at: null,
				buy_currency: formData.buy_currency,
				sell_currency: formData.sell_currency,
				buy_price: formData.buy_price ? parseFloat(formData.buy_price) : null,
				sell_price: formData.sell_price
					? parseFloat(formData.sell_price)
					: null,
				gem_treatment: formData.gem_treatment,
				sold: false,
				owner: formData.owner,
				// Find the gemstone type ID based on the name
				gem_type_id:
					gemstoneTypes.find((type) => type.name === formData.name)?.id || null,
				// Find shape_id based on the selected shape name
				shape_id:
					shapes.find((shape) => shape.name === formData.shape)?.id || null,
				// Find color_id based on the selected color name
				color_id:
					orgColors.find((color) => color.name === formData.color)?.id || null,
			});

			// If there are selected images, upload them in the background
			if (selectedImages.length > 0) {
				setIsUploadingImages(true);

				// Navigate back to the previous screen
				router.back();

				// Upload images in the background
				try {
					await uploadFiles({
						bucketName: "tus",
						path: `${activeOrganization.id}/${gemstone.id}`,
						pickerResult: { assets: selectedImages, canceled: false },
					});
				} catch (uploadError) {
					console.error("Error uploading images:", uploadError);
				} finally {
					setIsUploadingImages(false);
					await queryClient.invalidateQueries({ queryKey: ["gemstones"] });
					await queryClient.invalidateQueries({ queryKey: ["gemstone"] });
				}
			} else {
				// No images to upload, just navigate back
				router.back();
			}
		} catch (error) {
			setError({
				field: "submit",
				message: "Failed to create gemstone. Please try again later.",
			});
			console.error("Error creating gemstone:", error);
		}
	};

	const pickImage = async () => {
		try {
			const { status } =
				await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== "granted") {
				alert(t("gemstones.permissionNeeded.mediaLibrary"));
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				quality: 1,
				allowsMultipleSelection: true,
				selectionLimit: 10,
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
			});

			if (!result.canceled && result.assets) {
				setSelectedImages([...selectedImages, ...result.assets]);
			}
		} catch (error) {
			console.error("Error picking images:", error);
		}
	};

	const takePhoto = async () => {
		try {
			const { status } = await ImagePicker.requestCameraPermissionsAsync();
			if (status !== "granted") {
				alert(t("gemstones.permissionNeeded.camera"));
				return;
			}

			const result = await ImagePicker.launchCameraAsync({
				quality: 1,
				allowsEditing: true,
				aspect: [4, 3],
			});

			if (!result.canceled && result.assets) {
				setSelectedImages([...selectedImages, ...result.assets]);
			}
		} catch (error) {
			console.error("Error taking photo:", error);
		}
	};

	const removeImage = (index: number) => {
		const newImages = [...selectedImages];
		newImages.splice(index, 1);
		setSelectedImages(newImages);
	};

	if (!activeOrganization) {
		return (
			<SafeAreaProvider>
				<View style={styles.container}>
					<H3>{t("gemstones.noOrganization")}</H3>
				</View>
			</SafeAreaProvider>
		);
	}

	return (
		<SafeAreaProvider>
			<View style={{ flex: 1, backgroundColor }}>
				<ScrollView
					style={[styles.container, { backgroundColor }]}
					contentContainerStyle={styles.scrollContent}
				>
					<View style={styles.input}>
						<ComboBox
							allowCustom
							label="Stone type"
							value={formData.name || ""}
							options={gemstoneTypes.map((type) => ({
								id: type.name,
								title: type.name,
							}))}
							onChange={(value) => updateField("name", value)}
							onCreateNewOption={async (newValue) => {
								await addGemstoneType.mutateAsync(newValue);
							}}
						/>
					</View>

					<View style={styles.input}>
						<ComboBox
							label="Shape"
							allowCustom
							value={formData.shape || ""}
							options={shapes.map((shape) => ({
								id: shape.name,
								title: shape.name,
							}))}
							onChange={(value) => updateField("shape", value as string)}
							onCreateNewOption={async (newValue) => {
								await addShape.mutateAsync(newValue);
							}}
						/>
					</View>

					<View style={styles.input}>
						<ComboBox
							label="Color"
							allowCustom
							value={formData.color || ""}
							options={orgColors.map((color) => ({
								id: color.name,
								title: color.name,
							}))}
							onChange={(value) => updateField("color", value as string)}
							onCreateNewOption={async (newValue) => {
								await addColor.mutateAsync(newValue);
							}}
						/>
					</View>

					<View style={styles.input}>
						<ComboBox
							allowCustom
							label="Owner"
							key={`owner-${formData.owner}`}
							value={formData.owner}
							options={owners.map((owner) => ({
								id: owner.name,
								title: owner.name,
							}))}
							onChange={(value) => updateField("owner", value as GemstoneOwner)}
							onCreateNewOption={async (value) => {
								await addOwner.mutateAsync(value);
							}}
						/>
					</View>

					<TextInput
						label="Bill number"
						mode="outlined"
						defaultValue={formData.bill_number}
						onChangeText={(value) => updateField("bill_number", value)}
						style={[
							styles.input,
							error?.field === "bill_number" && styles.inputError,
						]}
						error={error?.field === "bill_number"}
					/>

					<TextInput
						label="Weight (ct)"
						mode="outlined"
						defaultValue={formData.weight}
						onChangeText={(value) => handleNumericInput(value, "weight")}
						keyboardType="decimal-pad"
						style={[
							styles.input,
							error?.field === "weight" && styles.inputError,
						]}
						error={error?.field === "weight"}
					/>

					<View style={styles.quantityContainer}>
						<TextInput
							label={t("gemstones.quantityPieces")}
							mode="outlined"
							defaultValue={formData.quantity}
							onChangeText={(value) => {
								// Only allow positive integers
								const numericValue = value.replace(/[^0-9]/g, "");
								// Ensure at least 1
								const finalValue = numericValue === "" ? "1" : numericValue;
								updateField("quantity", finalValue);
							}}
							keyboardType="number-pad"
							style={[
								styles.quantityInput,
								error?.field === "quantity" && styles.inputError,
							]}
							error={error?.field === "quantity"}
							placeholder="1"
						/>
					</View>

					<View style={styles.gemTypeContainer}>
						<View style={styles.radioGroup}>
							<TouchableOpacity
								style={[
									styles.radioCard,
									formData.gem_treatment === GemTreatmentEnum.NATURAL &&
										styles.radioCardSelected,
								]}
								onPress={() =>
									setFormData((prev) => ({
										...prev,
										gem_treatment: GemTreatmentEnum.NATURAL,
									}))
								}
								activeOpacity={0.7}
							>
								<View style={styles.radioIconContainer}>
									<View style={styles.radioOuterCircle}>
										{formData.gem_treatment === GemTreatmentEnum.NATURAL && (
											<View style={styles.radioInnerCircle} />
										)}
									</View>
								</View>
								<P
									style={
										formData.gem_treatment === GemTreatmentEnum.NATURAL
											? styles.radioTextSelected
											: styles.radioText
									}
								>
									{GemTreatmentLabels[GemTreatmentEnum.NATURAL]}
								</P>
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.radioCard,
									formData.gem_treatment === GemTreatmentEnum.HEATED &&
										styles.radioCardSelected,
								]}
								onPress={() =>
									setFormData((prev) => ({
										...prev,
										gem_treatment: GemTreatmentEnum.HEATED,
									}))
								}
								activeOpacity={0.7}
							>
								<View style={styles.radioIconContainer}>
									<View style={styles.radioOuterCircle}>
										{formData.gem_treatment === GemTreatmentEnum.HEATED && (
											<View style={styles.radioInnerCircle} />
										)}
									</View>
								</View>
								<P
									style={
										formData.gem_treatment === GemTreatmentEnum.HEATED
											? styles.radioTextSelected
											: styles.radioText
									}
								>
									{GemTreatmentLabels[GemTreatmentEnum.HEATED]}
								</P>
							</TouchableOpacity>
						</View>
					</View>

					<View style={styles.dimensionsContainer}>
						<TextInput
							label={t("gemstones.length")}
							mode="outlined"
							value={formData.dimensions.length}
							onChangeText={(value) => handleDimensionInput(value, "length")}
							keyboardType="decimal-pad"
							style={styles.dimensionInput}
						/>
						<TextInput
							label={t("gemstones.width")}
							mode="outlined"
							value={formData.dimensions.width}
							onChangeText={(value) => handleDimensionInput(value, "width")}
							keyboardType="decimal-pad"
							style={styles.dimensionInput}
						/>
						<TextInput
							label={t("gemstones.height")}
							mode="outlined"
							value={formData.dimensions.height}
							onChangeText={(value) => handleDimensionInput(value, "height")}
							keyboardType="decimal-pad"
							style={styles.dimensionInput}
						/>
					</View>
					<View style={styles.priceContainer}>
						<TextInput
							label={t("gemstones.buyPrice")}
							mode="outlined"
							defaultValue={formData.buy_price.toString()}
							onChangeText={(value) => updateField("buy_price", value)}
							keyboardType="decimal-pad"
							style={[
								styles.priceInput,
								error?.field === "buy_price" && styles.inputError,
							]}
						/>
						<View style={styles.currencyDropdown}>
							<Dropdown
								label={t("gemstones.currency")}
								mode="outlined"
								hideMenuHeader
								menuContentStyle={{ top: 60 }}
								value={formData.buy_currency}
								onSelect={(value) => updateField("buy_currency", value)}
								options={Object.values(Currency).map((currency) => ({
									label: currency,
									value: currency,
								}))}
							/>
						</View>
					</View>

					<View style={styles.priceContainer}>
						<TextInput
							label={t("gemstones.sellPrice")}
							mode="outlined"
							defaultValue={formData.sell_price.toString()}
							onChangeText={(value) => updateField("sell_price", value)}
							keyboardType="decimal-pad"
							style={[
								styles.priceInput,
								error?.field === "sell_price" && styles.inputError,
							]}
						/>
						<View style={styles.currencyDropdown}>
							<Dropdown
								label={t("gemstones.currency")}
								mode="outlined"
								hideMenuHeader
								menuContentStyle={{ top: 60 }}
								value={formData.sell_currency}
								onSelect={(value) => updateField("sell_currency", value)}
								options={Object.values(Currency).map((currency) => ({
									label: currency,
									value: currency,
								}))}
							/>
						</View>
					</View>

					<TextInput
						label={t("gemstones.buyer")}
						mode="outlined"
						defaultValue={formData.buyer}
						onChangeText={(value) => updateField("buyer", value)}
						style={[
							styles.input,
							error?.field === "buyer" && styles.inputError,
						]}
						error={error?.field === "buyer"}
					/>

					<TextInput
						label={t("gemstones.buyerAddress")}
						mode="outlined"
						defaultValue={formData.buyer_address}
						onChangeText={(value) => updateField("buyer_address", value)}
						style={[
							styles.input,
							error?.field === "buyer_address" && styles.inputError,
						]}
						error={error?.field === "buyer_address"}
						multiline
						numberOfLines={2}
					/>

					<View style={styles.input}>
						<DatePickerField
							label="Purchase date"
							date={
								formData.purchase_date
									? new Date(formData.purchase_date)
									: undefined
							}
							error={error?.field === "purchase_date"}
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
										purchase_date: utcDate.toISOString(),
									}));
								} else {
									setFormData((prev) => ({
										...prev,
										purchase_date: "",
									}));
								}
							}}
						/>
					</View>

					<View style={styles.imagesContainer}>
						<P style={styles.imagesTitle}>Images</P>
						<View style={styles.imageActions}>
							<Button
								mode="outlined"
								onPress={pickImage}
								icon="image"
								style={styles.imageButton}
							>
								Select Images
							</Button>
							<Button
								mode="outlined"
								onPress={takePhoto}
								icon="camera"
								style={styles.imageButton}
							>
								Take Photo
							</Button>
						</View>

						{selectedImages.length > 0 && (
							<View style={styles.imagePreviewContainer}>
								<P style={styles.previewTitle}>
									Selected Images ({selectedImages.length})
								</P>
								<ScrollView horizontal style={styles.imagePreviewScroll}>
									{selectedImages.map((image, index) => (
										<View key={index} style={styles.imagePreview}>
											<Image
												source={{ uri: image.uri }}
												style={styles.previewImage}
											/>
											<IconButton
												icon="close"
												size={20}
												onPress={() => removeImage(index)}
												style={styles.removeImageButton}
											/>
										</View>
									))}
								</ScrollView>
							</View>
						)}
					</View>

					<TextInput
						label="Comments"
						mode="outlined"
						defaultValue={formData.comment}
						onChangeText={(value) => updateField("comment", value)}
						multiline
						numberOfLines={3}
						style={styles.input}
					/>

					{/* Add bottom padding to ensure last field isn't covered by sticky button */}
					<View style={styles.bottomPadding} />
				</ScrollView>

				<View style={styles.stickyButtonContainer}>
					<Button
						mode="contained"
						onPress={handleSubmit}
						loading={createGemstone.isPending}
						disabled={createGemstone.isPending}
						style={styles.button}
					>
						{selectedImages.length > 0
							? "Add Gemstone & Upload Images"
							: "Add Gemstone"}
					</Button>
				</View>
			</View>
			<Snackbar
				visible={!!error}
				onDismiss={() => setError(null)}
				duration={3000}
				style={styles.errorSnackbar}
				theme={{
					colors: {
						surface: MD2Colors.red800,
					},
				}}
			>
				{error?.message || ""}
			</Snackbar>
			<Snackbar
				visible={isUploadingImages}
				onDismiss={() => {}}
				duration={Infinity}
				style={styles.uploadingSnackbar}
			>
				{t("gemstones.uploadingImages")}
			</Snackbar>
		</SafeAreaProvider>
	);
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
	scrollContent: {
		paddingBottom: 16, // Ensure content isn't hidden behind sticky button
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
	button: {
		marginBottom: 8,
	},
	stickyButtonContainer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "rgba(255, 255, 255, 0.9)",
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 16,
		borderTopWidth: 1,
		borderTopColor: "#e0e0e0",
		elevation: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
	},
	bottomPadding: {
		height: 80, // Provides space at bottom so last field isn't covered by sticky button
	},
	errorSnackbar: {
		backgroundColor: MD2Colors.red800,
	},
	quantityContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 16,
		gap: 16,
	},
	quantityInput: {
		flex: 1,
	},
	gemTypeContainer: {
		marginBottom: 16,
	},
	gemTypeLabel: {
		marginBottom: 8,
		fontWeight: "bold",
		fontSize: 16,
	},
	radioGroup: {
		flexDirection: "row",
		gap: 16,
	},
	radioContainer: {
		flexDirection: "row",
		gap: 16,
	},
	radioCard: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#CCCCCC",
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
	radioText: {
		fontSize: 16,
	},
	radioTextSelected: {
		fontWeight: "bold",
		color: "#6200EE",
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
	imagesContainer: {
		marginBottom: 16,
	},
	imagesTitle: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 8,
	},
	imageActions: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 8,
	},
	imageButton: {
		flex: 1,
		marginHorizontal: 4,
	},
	imagePreviewContainer: {
		marginTop: 8,
	},
	previewTitle: {
		fontSize: 14,
		marginBottom: 4,
	},
	imagePreviewScroll: {
		flexDirection: "row",
	},
	imagePreview: {
		position: "relative",
		marginRight: 8,
	},
	previewImage: {
		width: 80,
		height: 80,
		borderRadius: 4,
	},
	removeImageButton: {
		position: "absolute",
		top: -8,
		right: -8,
		backgroundColor: "rgba(0,0,0,0.5)",
		borderRadius: 12,
		width: 24,
		height: 24,
	},
	uploadingSnackbar: {
		backgroundColor: MD2Colors.blue800,
	},
});
