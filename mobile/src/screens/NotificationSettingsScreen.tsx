import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import NotificationManager from '../services/NotificationManager';
import Card from '../components/Card';
import Button from '../components/Button';

interface NotificationSettings {
  locationBasedEnabled: boolean;
  couponRemindersEnabled: boolean;
  merchantPromotionsEnabled: boolean;
  notificationRadius: number;
}

const NotificationSettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [settings, setSettings] = useState<NotificationSettings>({
    locationBasedEnabled: true,
    couponRemindersEnabled: true,
    merchantPromotionsEnabled: true,
    notificationRadius: 500,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const notificationManager = NotificationManager.getInstance();
    const currentSettings = notificationManager.getSettings();
    setSettings(currentSettings);
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean | number) => {
    try {
      setLoading(true);
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      const notificationManager = NotificationManager.getInstance();
      await notificationManager.updateSettings({ [key]: value });
      
      Alert.alert(
        t('notifications.settings.success.title'),
        t('notifications.settings.success.message')
      );
    } catch (error) {
      console.error('Failed to update notification setting:', error);
      Alert.alert(
        t('notifications.settings.error.title'),
        t('notifications.settings.error.message')
      );
      // Revert the setting
      loadSettings();
    } finally {
      setLoading(false);
    }
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      t('notifications.clear.confirm.title'),
      t('notifications.clear.confirm.message'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              const notificationManager = NotificationManager.getInstance();
              await notificationManager.clearAllNotifications();
              Alert.alert(
                t('notifications.clear.success.title'),
                t('notifications.clear.success.message')
              );
            } catch (error) {
              console.error('Failed to clear notifications:', error);
              Alert.alert(
                t('notifications.clear.error.title'),
                t('notifications.clear.error.message')
              );
            }
          },
        },
      ]
    );
  };

  const radiusOptions = [
    { label: '100m', value: 100 },
    { label: '250m', value: 250 },
    { label: '500m', value: 500 },
    { label: '1km', value: 1000 },
    { label: '2km', value: 2000 },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      padding: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    settingLabel: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    settingDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    radiusContainer: {
      padding: theme.spacing.md,
    },
    radiusOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.sm,
    },
    radiusOption: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      marginRight: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    radiusOptionSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    radiusOptionText: {
      color: theme.colors.text,
    },
    radiusOptionTextSelected: {
      color: theme.colors.white,
    },
    actionSection: {
      marginTop: theme.spacing.xl,
      padding: theme.spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.sectionTitle}>
          {t('notifications.settings.locationBased.title')}
        </Text>
        
        <Card>
          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>
                {t('notifications.settings.locationBased.enable')}
              </Text>
              <Text style={styles.settingDescription}>
                {t('notifications.settings.locationBased.description')}
              </Text>
            </View>
            <Switch
              value={settings.locationBasedEnabled}
              onValueChange={(value) => updateSetting('locationBasedEnabled', value)}
              disabled={loading}
            />
          </View>
        </Card>

        {settings.locationBasedEnabled && (
          <Card style={{ marginTop: theme.spacing.md }}>
            <View style={styles.radiusContainer}>
              <Text style={styles.settingLabel}>
                {t('notifications.settings.radius.title')}
              </Text>
              <Text style={styles.settingDescription}>
                {t('notifications.settings.radius.description')}
              </Text>
              <View style={styles.radiusOptions}>
                {radiusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.radiusOption,
                      settings.notificationRadius === option.value && styles.radiusOptionSelected,
                    ]}
                    onPress={() => updateSetting('notificationRadius', option.value)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.radiusOptionText,
                        settings.notificationRadius === option.value && styles.radiusOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
        )}

        <Text style={styles.sectionTitle}>
          {t('notifications.settings.coupons.title')}
        </Text>
        
        <Card>
          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>
                {t('notifications.settings.coupons.reminders')}
              </Text>
              <Text style={styles.settingDescription}>
                {t('notifications.settings.coupons.remindersDescription')}
              </Text>
            </View>
            <Switch
              value={settings.couponRemindersEnabled}
              onValueChange={(value) => updateSetting('couponRemindersEnabled', value)}
              disabled={loading}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>
          {t('notifications.settings.promotions.title')}
        </Text>
        
        <Card>
          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>
                {t('notifications.settings.promotions.enable')}
              </Text>
              <Text style={styles.settingDescription}>
                {t('notifications.settings.promotions.description')}
              </Text>
            </View>
            <Switch
              value={settings.merchantPromotionsEnabled}
              onValueChange={(value) => updateSetting('merchantPromotionsEnabled', value)}
              disabled={loading}
            />
          </View>
        </Card>

        <View style={styles.actionSection}>
          <Button
            title={t('notifications.clear.button')}
            onPress={clearAllNotifications}
            variant="outline"
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default NotificationSettingsScreen;