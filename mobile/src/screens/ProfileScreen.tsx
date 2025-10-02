import React from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {Text, List, Switch, Button, Divider} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppTranslation} from '@utils/i18n';
import {useAppSelector, useAppDispatch} from '@store/index';
import {logout} from '@store/slices/authSlice';
import {updateNotificationSettings} from '@store/slices/userSlice';
import {theme} from '@theme/index';

const ProfileScreen: React.FC = () => {
  const {t, changeLanguage, currentLanguage} = useAppTranslation();
  const dispatch = useAppDispatch();
  const {user} = useAppSelector(state => state.auth);
  const {profile} = useAppSelector(state => state.user);

  const handleLanguageChange = (language: string) => {
    changeLanguage(language);
  };

  const handleNotificationToggle = (setting: string, value: boolean) => {
    dispatch(updateNotificationSettings({[setting]: value}));
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const languages = [
    {code: 'zh-HK', name: '繁體中文'},
    {code: 'zh-CN', name: '简体中文'},
    {code: 'en', name: 'English'},
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            {t('profile.settings')}
          </Text>
          {user && (
            <Text variant="bodyMedium" style={styles.walletAddress}>
              {`${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <List.Section>
            <List.Subheader>{t('profile.language')}</List.Subheader>
            {languages.map((lang) => (
              <List.Item
                key={lang.code}
                title={lang.name}
                right={() => (
                  currentLanguage === lang.code ? (
                    <List.Icon icon="check" color={theme.colors.primary} />
                  ) : null
                )}
                onPress={() => handleLanguageChange(lang.code)}
              />
            ))}
          </List.Section>

          <Divider />

          <List.Section>
            <List.Subheader>{t('profile.notifications')}</List.Subheader>
            <List.Item
              title={t('notifications.settings.title')}
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Navigate to notification settings screen
                // This would be handled by navigation
                console.log('Navigate to notification settings');
              }}
            />
          </List.Section>

          <Divider />

          <List.Section>
            <List.Item
              title={t('profile.privacy')}
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            <List.Item
              title={t('profile.about')}
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
          </List.Section>
        </View>

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            textColor={theme.colors.error}
          >
            {t('profile.logout')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.sm,
  },
  walletAddress: {
    color: theme.colors.onSurfaceVariant,
    fontFamily: 'monospace',
  },
  section: {
    backgroundColor: theme.colors.surface,
  },
  footer: {
    padding: theme.spacing.md,
  },
  logoutButton: {
    borderColor: theme.colors.error,
  },
});

export default ProfileScreen;