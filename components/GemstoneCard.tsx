import { Tables } from "@/lib/database.types";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Card, Title } from "react-native-paper";
import { Badge } from "./ui/badge";
import { P } from "./ui/typography";
import { router } from "expo-router";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { ActivityIndicator } from "react-native-paper";

const GemstoneCard = ({ gemstone }: { gemstone: Tables<"stones"> }) => {
	const { signedUrl, isLoading } = useSignedUrl(
		gemstone.pictures?.[0],
		gemstone.id,
	);

	const defaultImage = "https://place-hold.it/300x300.jpg/666/fff/000";

	return (
		<Pressable onPress={() => router.push(`/(app)/gemstone/${gemstone.id}`)}>
			<Card style={styles.card}>
				{isLoading ? (
					<View style={[styles.image, styles.loadingContainer]}>
						<ActivityIndicator size="large" />
					</View>
				) : (
					<Image
						source={{
							uri: signedUrl?.uri || defaultImage,
						}}
						style={styles.image}
					/>
				)}
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
