import { supabase } from "@/config/supabase";
import * as ImagePicker from "expo-image-picker";
import { Upload } from "tus-js-client";

const getFileExtension = (uri: string): string => {
	const match = /\.([a-zA-Z]+)$/.exec(uri);
	if (match !== null) {
		return match[1];
	}

	return "";
};

const getMimeType = (extension: string): string => {
	if (extension === "jpg") return "image/jpeg";
	return `image/${extension}`;
};

export const uploadFiles = async ({
	bucketName,
	path,
	pickerResult,
}: {
	bucketName: string;
	path: string;
	pickerResult: ImagePicker.ImagePickerResult;
}) => {
	const allUploads = pickerResult.assets?.map(
		(file: ImagePicker.ImagePickerAsset) => {
			return new Promise<void>(async (resolve, reject) => {
				const { data: dataSession } = await supabase.auth.getSession();

				const extension = getFileExtension(file.uri);
				const filename =
					// @ts-ignore TODO: check why types are acting up here.
					file?.name ?? file?.fileName ?? `${Date.now()}.${extension}`;

				// Ensure the path starts with organization_id
				const objectName = `${path}/${filename}`;

				const blob = await fetch(file.uri).then((res) => res.blob());
				let upload = new Upload(blob, {
					endpoint: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
					retryDelays: [0, 3000, 5000, 10000, 20000],
					headers: {
						authorization: `Bearer ${dataSession?.session?.access_token}`,
						"x-upsert": "true",
					},
					uploadDataDuringCreation: true,
					removeFingerprintOnSuccess: true,
					metadata: {
						bucketName: bucketName,
						objectName: objectName,
						contentType: getMimeType(extension),
						cacheControl: "3600",
					},
					chunkSize: 6 * 1024 * 1024, // NOTE: it must be set to 6MB (for now) do not change it
					onError: function (error) {
						console.log("Failed because: " + error);
						reject(error);
					},
					onProgress: function (bytesUploaded, bytesTotal) {
						var percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
						console.log(bytesUploaded, bytesTotal, percentage + "%");
					},
					onSuccess: function () {
						console.log("Uploaded %s", upload.options?.metadata?.objectName);
						resolve();
					},
				});

				// Check if there are any previous uploads to continue.
				return upload.findPreviousUploads().then(function (previousUploads) {
					// Found previous uploads so we select the first one.
					if (previousUploads.length) {
						upload.resumeFromPreviousUpload(previousUploads[0]);
					}

					// Start the upload
					upload.start();
				});
			});
		},
	);
	if (!allUploads) return;
	const response = await Promise.allSettled(allUploads);
	console.log(JSON.stringify({ response }, null, 2));
	return;
};
