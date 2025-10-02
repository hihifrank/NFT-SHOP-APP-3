import React from 'react';
import {StyleSheet, ViewStyle} from 'react-native';
import {TextInput, TextInputProps, HelperText} from 'react-native-paper';
import {theme} from '@theme/index';

interface InputProps extends Omit<TextInputProps, 'style' | 'ref'> {
  helperText?: string;
  errorText?: string;
  style?: ViewStyle;
}

const Input: React.FC<InputProps> = ({
  helperText,
  errorText,
  style,
  ...props
}) => {
  const hasError = Boolean(errorText);

  return (
    <>
      <TextInput
        style={[styles.input, style] as ViewStyle}
        mode="outlined"
        error={hasError}
        outlineStyle={styles.outline}
        contentStyle={styles.content}
        {...props}
      />
      {(helperText || errorText) && (
        <HelperText type={hasError ? 'error' : 'info'} visible>
          {errorText || helperText}
        </HelperText>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    marginVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  outline: {
    borderRadius: theme.custom.borderRadius.medium,
  },
  content: {
    fontSize: 16,
  },
});

export default Input;