import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../../constants/colors';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const AppInput = React.forwardRef<any, AppInputProps>(
  (
    {
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      containerStyle,
      style,
      ...rest
    },
    ref
  ) => {
    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputWrapper,
            error ? styles.inputWrapperError : null,
            rest.multiline ? styles.multilineWrapper : null,
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              rest.multiline ? styles.multilineInput : null,
              style,
            ]}
            placeholderTextColor={COLORS.secondaryText}
            {...rest}
          />
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : helper ? (
          <Text style={styles.helperText}>{helper}</Text>
        ) : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  multilineWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 10,
    minHeight: 100,
  },
  inputWrapperError: {
    borderColor: COLORS.danger,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 10,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    color: COLORS.secondaryText,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
