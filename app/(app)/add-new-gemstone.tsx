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
import { ComboBox } from "@/components/ui/combobox";
import { H3, P } from "@/components/ui/typography";
import { colors } from "@/constants/colors";
import { useSupabase } from "@/context/supabase-provider";
import { useCreateGemstone } from "@/hooks/useCreateGemstone";
import { uploadFiles } from "@/lib/tus";
import { useColorScheme } from "@/lib/useColorScheme";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
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
import {
	DatePickerInput,
	enGB,
	registerTranslation,
} from "react-native-paper-dates";
import { Dropdown } from "react-native-paper-dropdown";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Register the English locale
registerTranslation("en", enGB);

type ValidationError = {
	field: string;
	message: string;
};

export default function AddNewGemstone() {
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

	const queryClient = useQueryClient();

	const [formData, setFormData] = useState({
		name: "",
		bill_number: "",
		shape: "",
		color: "",
		cut: "",
		weight: "",
		quantity: "1",
		gem_type: GemTypeEnum.NATURAL,
		comment: "",
		date: new Date().toISOString().split("T")[0],
		dimensions: { length: "", width: "", height: "" },
		buy_price: 0,
		sell_price: 0,
		buy_currency: Currency.RMB,
		sell_currency: Currency.RMB,
		purchase_date: new Date().toISOString().split("T")[0],
		sold_at: null as string | null,
		buyer: "",
		buyer_address: "",
		owner: "Nuo",
	});

	const updateField = (field: string, value?: string | GemTypeEnum) => {
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
				message: "Stone type is required",
			};
		}

		if (formData.weight && isNaN(parseFloat(formData.weight))) {
			return {
				field: "weight",
				message: "Weight must be a valid number",
			};
		}

		if (
			!formData.quantity ||
			isNaN(parseInt(formData.quantity)) ||
			parseInt(formData.quantity) < 1
		) {
			return {
				field: "quantity",
				message: "Quantity must be at least 1",
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
				gem_type: formData.gem_type,
				sold: false,
				owner: formData.owner,
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
				alert("We need your permission to access your media library");
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
				alert("We need your permission to access your camera");
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
					<H3>No organization found. Please join an organization first.</H3>
				</View>
			</SafeAreaProvider>
		);
	}

	return (
		<SafeAreaProvider>
			<ScrollView style={[styles.container, { backgroundColor }]}>
				<View style={styles.input}>
					<ComboBox
						allowCustom
						label="Stone type"
						value={formData.name || ""}
						options={Object.values(GemstoneType).map((type) => ({
							id: type,
							title: type,
						}))}
						onChange={(value) => updateField("name", value as GemstoneType)}
					/>
				</View>

				<View style={styles.input}>
					<ComboBox
						label="Shape"
						allowCustom
						value={formData.shape || ""}
						options={Object.values(GemstoneShape).map((shape) => ({
							id: shape,
							title: shape,
						}))}
						onChange={(value) => updateField("shape", value as GemstoneShape)}
					/>
				</View>

				<View style={styles.input}>
					<ComboBox
						label="Color"
						allowCustom
						value={formData.color || ""}
						options={Object.values(GemstoneColor).map((color) => ({
							id: color,
							title: color,
						}))}
						onChange={(value) => updateField("color", value as GemstoneColor)}
					/>
				</View>

				<View style={styles.input}>
					<ComboBox
						allowCustom
						label="Owner"
						value={formData.owner || ""}
						options={Object.values(GemstoneOwner).map((owner) => ({
							id: owner,
							title: owner,
						}))}
						onChange={(value) => updateField("owner", value as GemstoneOwner)}
					/>
				</View>

				<TextInput
					label="Bill number"
					mode="outlined"
					value={formData.bill_number}
					onChangeText={(value) => updateField("bill_number", value)}
					style={[
						styles.input,
						error?.field === "bill_number" && styles.inputError,
					]}
					error={error?.field === "bill_number"}
				/>

				<TextInput
					label="Weight (carats)"
					mode="outlined"
					value={formData.weight}
					onChangeText={(value) => handleNumericInput(value, "weight")}
					keyboardType="decimal-pad"
					style={[styles.input, error?.field === "weight" && styles.inputError]}
					error={error?.field === "weight"}
				/>

				<View style={styles.quantityContainer}>
					<TextInput
						label="Quantity (pieces)"
						mode="outlined"
						value={formData.quantity}
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
				<View style={styles.priceContainer}>
					<TextInput
						label="Buy price"
						mode="outlined"
						value={formData.buy_price.toString()}
						onChangeText={(value) => updateField("buy_price", value)}
						keyboardType="decimal-pad"
						style={[
							styles.priceInput,
							error?.field === "buy_price" && styles.inputError,
						]}
						left={
							<TextInput.Affix text={CurrencySymbols[formData.buy_currency]} />
						}
					/>
					<View style={styles.currencyDropdown}>
						<Dropdown
							label="Currency"
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
						label="Sell price"
						mode="outlined"
						value={formData.sell_price.toString()}
						onChangeText={(value) => updateField("sell_price", value)}
						keyboardType="decimal-pad"
						style={[
							styles.priceInput,
							error?.field === "sell_price" && styles.inputError,
						]}
						left={
							<TextInput.Affix text={CurrencySymbols[formData.sell_currency]} />
						}
					/>
					<View style={styles.currencyDropdown}>
						<Dropdown
							label="Currency"
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
					label="Buyer"
					mode="outlined"
					value={formData.buyer}
					onChangeText={(value) => updateField("buyer", value)}
					style={[styles.input, error?.field === "buyer" && styles.inputError]}
					error={error?.field === "buyer"}
				/>

				<TextInput
					label="Buyer Address"
					mode="outlined"
					value={formData.buyer_address}
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
					<DatePickerInput
						locale="en"
						label="Purchase date"
						value={
							formData.purchase_date
								? new Date(formData.purchase_date)
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
						error={error?.field === "sold_at"}
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
					{selectedImages.length > 0
						? "Add Gemstone & Upload Images"
						: "Add Gemstone"}
				</Button>
			</ScrollView>
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
				Uploading images in background...
			</Snackbar>
		</SafeAreaProvider>
	);
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
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
		marginTop: 8,
		marginBottom: 24,
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
