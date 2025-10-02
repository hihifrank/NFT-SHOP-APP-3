import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {Card, Text, Button, Chip, Modal, Portal} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '@theme/index';
import {NFT} from '@store/slices/web3Slice';

interface NFTCardProps {
  nft: NFT;
  onUse?: (tokenId: string) => void;
  onTransfer?: (nft: NFT) => void;
  onPurchase?: (tokenId: string, price: string) => void;
  showActions?: boolean;
  isOwned?: boolean;
  price?: string;
}

const NFTCard: React.FC<NFTCardProps> = ({
  nft,
  onUse,
  onTransfer,
  onPurchase,
  showActions = true,
  isOwned = false,
  price,
}) => {
  const [detailsVisible, setDetailsVisible] = useState(false);

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return theme.colors.nftGold;
      case 'epic':
        return theme.colors.secondary;
      case 'rare':
        return theme.colors.primary;
      case 'common':
        return theme.colors.onSurfaceVariant;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getRarityFromAttributes = () => {
    const rarityAttr = nft.attributes.find(attr => 
      attr.trait_type.toLowerCase() === 'rarity'
    );
    return rarityAttr?.value as string || 'Common';
  };

  const getDiscountFromAttributes = () => {
    const discountAttr = nft.attributes.find(attr => 
      attr.trait_type.toLowerCase() === 'discount'
    );
    return discountAttr?.value as string || '';
  };

  const getExpiryFromAttributes = () => {
    const expiryAttr = nft.attributes.find(attr => 
      attr.trait_type.toLowerCase() === 'expiry'
    );
    return expiryAttr?.value as string || '';
  };

  const rarity = getRarityFromAttributes();
  const discount = getDiscountFromAttributes();
  const expiry = getExpiryFromAttributes();

  return (
    <>
      <TouchableOpacity onPress={() => setDetailsVisible(true)}>
        <Card style={styles.card}>
          <Card.Content style={styles.content}>
            {/* NFT Image */}
            <View style={styles.imageContainer}>
              {nft.image ? (
                <Image source={{uri: nft.image}} style={styles.nftImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Icon name="image" size={48} color={theme.colors.onSurfaceVariant} />
                </View>
              )}
              
              {/* Rarity Badge */}
              <Chip 
                mode="flat" 
                style={[styles.rarityChip, {backgroundColor: getRarityColor(rarity)}]}
                textStyle={styles.rarityText}
              >
                {rarity}
              </Chip>
            </View>

            {/* NFT Info */}
            <View style={styles.infoContainer}>
              <Text variant="titleMedium" style={styles.nftName} numberOfLines={2}>
                {nft.name}
              </Text>
              
              <Text variant="bodySmall" style={styles.nftDescription} numberOfLines={2}>
                {nft.description}
              </Text>

              {/* Discount Info */}
              {discount && (
                <View style={styles.discountContainer}>
                  <Icon name="local-offer" size={16} color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={styles.discountText}>
                    {discount}
                  </Text>
                </View>
              )}

              {/* Expiry Info */}
              {expiry && (
                <View style={styles.expiryContainer}>
                  <Icon name="schedule" size={14} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodySmall" style={styles.expiryText}>
                    Expires: {expiry}
                  </Text>
                </View>
              )}

              {/* Price for purchase */}
              {price && !isOwned && (
                <View style={styles.priceContainer}>
                  <Text variant="titleSmall" style={styles.priceText}>
                    {price} MATIC
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            {showActions && (
              <View style={styles.actionsContainer}>
                {isOwned ? (
                  <>
                    <Button 
                      mode="contained" 
                      compact 
                      style={styles.useButton}
                      onPress={() => onUse?.(nft.tokenId)}
                    >
                      使用
                    </Button>
                    <Button 
                      mode="outlined" 
                      compact 
                      style={styles.transferButton}
                      onPress={() => onTransfer?.(nft)}
                    >
                      轉移
                    </Button>
                  </>
                ) : (
                  <Button 
                    mode="contained" 
                    style={styles.purchaseButton}
                    onPress={() => onPurchase?.(nft.tokenId, price || '0')}
                  >
                    購買
                  </Button>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {/* NFT Details Modal */}
      <Portal>
        <Modal
          visible={detailsVisible}
          onDismiss={() => setDetailsVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge" style={styles.modalTitle}>
                  NFT詳情
                </Text>
                <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                  <Icon name="close" size={24} color={theme.colors.onSurface} />
                </TouchableOpacity>
              </View>

              {/* NFT Image */}
              <View style={styles.modalImageContainer}>
                {nft.image ? (
                  <Image source={{uri: nft.image}} style={styles.modalNftImage} />
                ) : (
                  <View style={styles.modalPlaceholderImage}>
                    <Icon name="image" size={64} color={theme.colors.onSurfaceVariant} />
                  </View>
                )}
              </View>

              {/* NFT Details */}
              <Text variant="titleMedium" style={styles.modalNftName}>
                {nft.name}
              </Text>
              
              <Text variant="bodyMedium" style={styles.modalNftDescription}>
                {nft.description}
              </Text>

              {/* Contract Info */}
              <View style={styles.contractInfo}>
                <Text variant="bodySmall" style={styles.contractLabel}>
                  合約地址:
                </Text>
                <Text variant="bodySmall" style={styles.contractAddress}>
                  {nft.contractAddress.slice(0, 10)}...{nft.contractAddress.slice(-8)}
                </Text>
              </View>

              <View style={styles.tokenInfo}>
                <Text variant="bodySmall" style={styles.tokenLabel}>
                  Token ID:
                </Text>
                <Text variant="bodySmall" style={styles.tokenId}>
                  #{nft.tokenId}
                </Text>
              </View>

              {/* Attributes */}
              <Text variant="titleSmall" style={styles.attributesTitle}>
                屬性
              </Text>
              <View style={styles.attributesContainer}>
                {nft.attributes.map((attr, index) => (
                  <View key={index} style={styles.attributeItem}>
                    <Text variant="bodySmall" style={styles.attributeType}>
                      {attr.trait_type}
                    </Text>
                    <Text variant="bodyMedium" style={styles.attributeValue}>
                      {attr.value}
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: theme.custom.elevation.small,
  },
  content: {
    padding: theme.spacing.md,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  nftImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.custom.borderRadius.medium,
    backgroundColor: theme.colors.surfaceVariant,
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.custom.borderRadius.medium,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityChip: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  rarityText: {
    color: theme.colors.onPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  infoContainer: {
    marginBottom: theme.spacing.md,
  },
  nftName: {
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  nftDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  discountText: {
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  expiryText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  priceContainer: {
    marginTop: theme.spacing.sm,
  },
  priceText: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  useButton: {
    flex: 1,
  },
  transferButton: {
    flex: 1,
  },
  purchaseButton: {
    flex: 1,
  },
  modalContainer: {
    margin: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontWeight: '600',
  },
  modalImageContainer: {
    marginBottom: theme.spacing.lg,
  },
  modalNftImage: {
    width: '100%',
    height: 250,
    borderRadius: theme.custom.borderRadius.medium,
    backgroundColor: theme.colors.surfaceVariant,
  },
  modalPlaceholderImage: {
    width: '100%',
    height: 250,
    borderRadius: theme.custom.borderRadius.medium,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalNftName: {
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  modalNftDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.lg,
  },
  contractInfo: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  contractLabel: {
    color: theme.colors.onSurfaceVariant,
    marginRight: theme.spacing.sm,
  },
  contractAddress: {
    fontFamily: 'monospace',
    color: theme.colors.onSurface,
  },
  tokenInfo: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  tokenLabel: {
    color: theme.colors.onSurfaceVariant,
    marginRight: theme.spacing.sm,
  },
  tokenId: {
    fontFamily: 'monospace',
    color: theme.colors.onSurface,
  },
  attributesTitle: {
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  attributesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  attributeItem: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.sm,
    borderRadius: theme.custom.borderRadius.small,
    minWidth: 100,
  },
  attributeType: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  attributeValue: {
    fontWeight: '600',
    marginTop: 2,
  },
});

export default NFTCard;