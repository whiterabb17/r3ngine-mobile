import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Share,
  Clipboard,
  Alert
} from 'react-native';
import { Stack } from 'expo-router';
import { Send, Copy, Share2, CornerDownRight } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';

interface GenericToolScreenProps {
  title: string;
  placeholder: string;
  description: string;
  onRun: (input: string) => Promise<any>;
}

const GenericToolScreen: React.FC<GenericToolScreenProps> = ({ 
  title, 
  placeholder, 
  description, 
  onRun 
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await onRun(input.trim());
      setResult(data);
    } catch (error: any) {
      Alert.alert('Tool Error', error.message || 'Failed to execute tool.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    Clipboard.setString(JSON.stringify(result, null, 2));
    Alert.alert('Success', 'Result copied to clipboard');
  };

  const shareResult = async () => {
    if (!result) return;
    try {
      await Share.share({
        message: JSON.stringify(result, null, 2),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const renderJson = (obj: any) => {
    return (
      <View style={styles.jsonContainer}>
        <Text style={styles.jsonText}>
          {JSON.stringify(obj, null, 2)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title }} />
      
      <View style={styles.header}>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={Theme.colors.textMuted}
            value={input}
            onChangeText={setInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity 
            style={[styles.runButton, !input.trim() && styles.runButtonDisabled]}
            onPress={handleRun}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {result ? (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <View style={styles.resultTitleGroup}>
                <CornerDownRight size={16} color={Theme.colors.primary} />
                <Text style={styles.resultTitle}>Results</Text>
              </View>
              <View style={styles.resultActions}>
                <TouchableOpacity onPress={copyToClipboard} style={styles.actionButton}>
                  <Copy size={18} color={Theme.colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={shareResult} style={styles.actionButton}>
                  <Share2 size={18} color={Theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            {renderJson(result)}
          </View>
        ) : !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Enter a target above to begin analysis.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  description: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 8,
    padding: 12,
    color: Theme.colors.text,
    fontSize: 16,
    marginRight: 12,
  },
  runButton: {
    backgroundColor: Theme.colors.primary,
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  runButtonDisabled: {
    opacity: 0.5,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTitle: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  jsonContainer: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  jsonText: {
    color: '#10b981', // Classic "Hacker" green
    fontFamily: 'SpaceMono',
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default GenericToolScreen;
