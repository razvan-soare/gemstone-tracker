import { supabase } from "@/config/supabase";
import { useSupabase } from "@/context/supabase-provider";
import { useEffect, useState } from "react";

export type SignedUrlResult = {
	uri: string;
};

export const useSignedUrl = (url?: string, gemstoneId?: string) => {
	const [signedUrl, setSignedUrl] = useState<SignedUrlResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const { activeOrganization } = useSupabase();

	useEffect(() => {
		const getSignedUrl = async () => {
			if (!url || !gemstoneId || !activeOrganization?.id) return;

			setIsLoading(true);
			setError(null);

			try {
				const lastSegment = url.split("/").pop();
				const bucketPath = `${activeOrganization.id}/${gemstoneId}/${lastSegment}`;

				const { data, error } = await supabase.storage
					.from("gemstone")
					.createSignedUrl(bucketPath, 60 * 60); // 1 hour expiry

				if (error) {
					// Try downloading directly
					const { data: downloadData, error: downloadError } =
						await supabase.storage.from("gemstone").download(bucketPath);

					if (downloadError) throw downloadError;

					if (downloadData) {
						const blobUrl = URL.createObjectURL(downloadData);
						setSignedUrl({ uri: blobUrl });
						return;
					}

					throw error;
				}

				if (data?.signedUrl) {
					setSignedUrl({ uri: data.signedUrl });
				}
			} catch (err) {
				console.error("Error getting signed URL:", err);
				setError(
					err instanceof Error ? err : new Error("Failed to get signed URL"),
				);
				// Fallback to original URL
				setSignedUrl({ uri: url });
			} finally {
				setIsLoading(false);
			}
		};

		getSignedUrl();
	}, [url, gemstoneId, activeOrganization?.id]);

	return { signedUrl, isLoading, error };
};

// Helper hook for multiple URLs
export const useSignedUrls = (urls: string[] = [], gemstoneId?: string) => {
	const [signedUrls, setSignedUrls] = useState<SignedUrlResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const { activeOrganization } = useSupabase();

	useEffect(() => {
		const getSignedUrls = async () => {
			if (!urls.length || !gemstoneId || !activeOrganization?.id) {
				setSignedUrls([]);
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const signedUrlPromises = urls.map(async (url) => {
					const lastSegment = url.split("/").pop();
					const bucketPath = `${activeOrganization.id}/${gemstoneId}/${lastSegment}`;

					const { data, error } = await supabase.storage
						.from("gemstone")
						.createSignedUrl(bucketPath, 60 * 60);

					if (error) {
						// Try downloading directly
						const { data: downloadData } = await supabase.storage
							.from("gemstone")
							.download(bucketPath);

						if (downloadData) {
							const blobUrl = URL.createObjectURL(downloadData);
							return { uri: blobUrl };
						}
						return { uri: url };
					}

					return { uri: data.signedUrl };
				});

				const resolvedUrls = await Promise.all(signedUrlPromises);
				setSignedUrls(resolvedUrls.filter((url) => url.uri));
			} catch (err) {
				console.error("Error getting signed URLs:", err);
				setError(
					err instanceof Error ? err : new Error("Failed to get signed URLs"),
				);
				// Fallback to original URLs
				setSignedUrls(urls.map((url) => ({ uri: url })));
			} finally {
				setIsLoading(false);
			}
		};

		getSignedUrls();
	}, [urls, gemstoneId, activeOrganization?.id]);

	return { signedUrls, isLoading, error };
};
