import { Tables } from "@/lib/database.types";
import {
	getGemstoneImageUrl,
	getSignedImageUrls,
	normalizePicture,
} from "@/lib/imageUtils";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Card, Title } from "react-native-paper";
import { Badge } from "./ui/badge";
import { P } from "./ui/typography";

const GemstoneCard = ({ gemstone }: { gemstone: Tables<"stones"> }) => {
	const defaultImage = "https://place-hold.it/300x300.jpg/666/fff/000";
	const [signedUrls, setSignedUrls] = useState<
		Record<string, Record<string, string>>
	>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadSignedUrls = async () => {
			if (!gemstone?.pictures?.length) {
				setLoading(false);
				return;
			}

			try {
				const urls = await getSignedImageUrls(gemstone.pictures);
				setSignedUrls(urls);
			} catch (error) {
				console.error("Error loading signed URLs:", error);
			} finally {
				setLoading(false);
			}
		};

		loadSignedUrls();
	}, [gemstone?.pictures]);

	// Get the thumbnail image URL for the card (smaller and faster to load)
	const imageUrl = getGemstoneImageUrl(
		signedUrls,
		gemstone?.pictures || [],
		"thumbnail",
		defaultImage,
	);

	return (
		<Pressable onPress={() => router.push(`/(app)/gemstone/${gemstone.id}`)}>
			<Card style={styles.card}>
				<Image
					source={{
						uri: imageUrl,
					}}
					style={styles.image}
				/>

				<Card.Content>
					<Title style={styles.title}>{gemstone.name}</Title>
					<View style={styles.chipsWrapper}>
						<Badge variant="outline" style={styles.chipBox}>
							<P style={styles.chip}>{gemstone.shape}</P>
						</Badge>
						<Badge variant="outline" style={styles.chipBox}>
							<P style={styles.chip}>{gemstone.weight} kt</P>
						</Badge>
						<Badge variant="outline" style={styles.chipBox}>
							<P style={styles.chip}>{gemstone.color}</P>
						</Badge>
						<Badge variant="outline" style={styles.chipBox}>
							<P style={styles.chip}>{gemstone.cut}</P>
						</Badge>
					</View>
				</Card.Content>
			</Card>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	title: {
		fontSize: 16,
		fontWeight: "bold",
	},
	card: {
		elevation: 4,
	},
	image: {
		width: "100%",
		aspectRatio: 1,
		resizeMode: "cover",
		marginBottom: 8,
		borderRadius: 8,
		borderBottomEndRadius: 0,
		borderBottomStartRadius: 0,
	},
	loadingContainer: {
		backgroundColor: "#f5f5f5",
		justifyContent: "center",
		alignItems: "center",
	},
	chipsWrapper: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 4,
	},
	chipBox: {
		borderRadius: 6,
		borderColor: "#555",
	},
	chip: {
		padding: 0,
		fontSize: 12,
	},
});

export default GemstoneCard;
