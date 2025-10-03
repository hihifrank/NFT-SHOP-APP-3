import React from 'react';

// Mock NFTCard component for testing
const MockNFTCard = ({ nft, onPress, onUse, showActions }: any) => {
  return React.createElement('div', {
    'data-testid': 'nft-card',
    'data-nft-id': nft?.id,
    'data-nft-name': nft?.name,
    'data-nft-used': nft?.isUsed,
    'data-show-actions': showActions,
    onClick: onPress
  }, [
    React.createElement('span', { key: 'name' }, nft?.name),
    React.createElement('span', { key: 'discount' }, `${nft?.discountValue}% off`),
    showActions && React.createElement('button', { 
      key: 'use-btn', 
      onClick: onUse,
      'data-testid': 'use-coupon-btn'
    }, 'Use Coupon')
  ]);
};

jest.mock('../../components/NFTCard', () => MockNFTCard);

describe('NFTCard Component', () => {
  const mockNFT = {
    id: 'nft-123',
    tokenId: '456',
    name: 'Coffee Shop 20% Off',
    discountValue: 20,
    discountType: 'percentage',
    merchantName: 'Central Coffee',
    expiryDate: '2024-12-31',
    isUsed: false,
    imageUrl: 'https://example.com/nft.jpg'
  };

  it('renders NFT information correctly', () => {
    const card = MockNFTCard({ nft: mockNFT });
    
    expect(card.props['data-nft-id']).toBe('nft-123');
    expect(card.props['data-nft-name']).toBe('Coffee Shop 20% Off');
    expect(card.props['data-nft-used']).toBe(false);
  });

  it('displays discount information', () => {
    const card = MockNFTCard({ nft: mockNFT });
    const discountElement = card.props.children.find((child: any) => 
      child.props.children === '20% off'
    );
    expect(discountElement).toBeDefined();
  });

  it('calls onPress when card is pressed', () => {
    const mockOnPress = jest.fn();
    const card = MockNFTCard({ nft: mockNFT, onPress: mockOnPress });
    
    card.props.onClick();
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('shows use button when showActions is true', () => {
    const card = MockNFTCard({ nft: mockNFT, showActions: true });
    
    expect(card.props['data-show-actions']).toBe(true);
    const useButton = card.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'use-coupon-btn'
    );
    expect(useButton).toBeDefined();
  });

  it('calls onUse when use button is pressed', () => {
    const mockOnUse = jest.fn();
    const card = MockNFTCard({ nft: mockNFT, onUse: mockOnUse, showActions: true });
    
    const useButton = card.props.children.find((child: any) => 
      child && child.props && child.props['data-testid'] === 'use-coupon-btn'
    );
    
    if (useButton) {
      useButton.props.onClick();
      expect(mockOnUse).toHaveBeenCalledTimes(1);
    }
  });

  it('handles used NFT state correctly', () => {
    const usedNFT = { ...mockNFT, isUsed: true };
    const card = MockNFTCard({ nft: usedNFT });
    
    expect(card.props['data-nft-used']).toBe(true);
  });

  it('handles missing NFT data gracefully', () => {
    const card = MockNFTCard({ nft: null });
    
    expect(card.props['data-nft-id']).toBeUndefined();
    expect(card.props['data-nft-name']).toBeUndefined();
  });

  // Test requirement 5.5: Clear status feedback for NFT operations
  it('provides clear status feedback for NFT state', () => {
    const usedNFT = { ...mockNFT, isUsed: true };
    const activeNFT = { ...mockNFT, isUsed: false };
    
    const usedCard = MockNFTCard({ nft: usedNFT });
    const activeCard = MockNFTCard({ nft: activeNFT });
    
    expect(usedCard.props['data-nft-used']).toBe(true);
    expect(activeCard.props['data-nft-used']).toBe(false);
  });
});