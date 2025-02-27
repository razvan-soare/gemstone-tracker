import { uploadFiles } from "@/lib/tus";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

export const useImageUpload = (path: string) => {
	const [uploading, setUploading] = useState(false);

	const mediaPermission = async (message: string) => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			alert(message);
			return false;
		}
		return true;
	};
	const cameraPermission = async (message: string) => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			alert(message);
			return false;
		}
		return true;
	};

	const pickImage = async ({
		setTempImagePreviews,
	}: {
		setTempImagePreviews?: (assets: ImagePicker.ImagePickerAsset[]) => void;
	}) => {
		const mediaPermissionGranted = await mediaPermission(
			"We need your permission to access your media library",
		);
		if (!mediaPermissionGranted) return;

		const result = await ImagePicker.launchImageLibraryAsync({
			quality: 1,
			allowsMultipleSelection: true,
			selectionLimit: 10,
			mediaTypes: ["images", "videos", "livePhotos"],
		});
		if (setTempImagePreviews) {
			setTempImagePreviews(result.assets ?? []);
		}
		await handleAssetsPicked(result);
		if (setTempImagePreviews) {
			setTempImagePreviews([]);
		}
	};

	const takePhoto = async ({
		setTempImagePreviews,
	}: {
		setTempImagePreviews?: (assets: ImagePicker.ImagePickerAsset[]) => void;
	}) => {
		const cameraPermissionGranted = await cameraPermission(
			"We need your permission to access your camera",
		);
		if (!cameraPermissionGranted) return;

		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			quality: 1,
			aspect: [4, 3],
			selectionLimit: 10,
		});
		if (setTempImagePreviews) {
			setTempImagePreviews(result.assets ?? []);
		}
		await handleAssetsPicked(result);
		if (setTempImagePreviews) {
			setTempImagePreviews([]);
		}
	};

	const handleAssetsPicked = async (results: ImagePicker.ImagePickerResult) => {
		try {
			setUploading(true);
			if (!results.canceled) {
				await uploadFiles({
					bucketName: "tus",
					path,
					pickerResult: results,
				});
			}
		} catch (e) {
			console.log({ e });
			alert("Upload fialed, sorry");
		} finally {
			setUploading(false);
		}
	};

	return {
		uploading,
		takePhoto,
		pickImage,
	};
};
