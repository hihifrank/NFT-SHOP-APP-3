import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text, Button, Card} from 'react-native-paper';
import {theme} from '@theme/index';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  retryText = '重試',
}) => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <Text variant="titleMedium" style={styles.title}>
            發生錯誤
          </Text>
          <Text variant="bodyMedium" style={styles.message}>
            {message}
          </Text>
          {onRetry && (
            <Button
              mode="contained"
              onPress={onRetry}
              style={styles.retryButton}
            >
              {retryText}
            </Button>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.errorContainer,
    width: '100%',
    maxWidth: 400,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    color: theme.colors.onErrorContainer,
    marginBottom: theme.spacing.sm,
  },
  message: {
    color: theme.colors.onErrorContainer,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    marginTop: theme.spacing.sm,
  },
});

export default ErrorMessage;