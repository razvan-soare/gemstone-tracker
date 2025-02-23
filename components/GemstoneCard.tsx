import { StyleSheet, Image } from "react-native";
import { Card, Title, Paragraph } from "react-native-paper";
import { Tables } from "@/lib/database.types";

const GemstoneCard = ({ gemstone }: { gemstone: Tables<"stones"> }) => {
	return (
		<Card style={styles.card}>
			<Card.Content>
				<Image source={{ uri: gemstone.pictures?.[0] }} style={styles.image} />
				<Title>{gemstone.name}</Title>
				<Paragraph>Shape: {gemstone.shape}</Paragraph>
				<Paragraph>Price: ${gemstone.weight}</Paragraph>
			</Card.Content>
		</Card>
	);
};

const styles = StyleSheet.create({
	card: {
		marginBottom: 16,
		elevation: 4,
	},
	image: {
		width: "100%",
		height: 200,
		resizeMode: "cover",
		marginBottom: 8,
		borderRadius: 8,
	},
});

export default GemstoneCard;
