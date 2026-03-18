import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Modal, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle } from 'react-native-svg'
import { useTaskContext } from '../context/TaskContext'
import { COLORS } from '../constants'

// Google "G" icon SVG
const GoogleG = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <Path fill="none" d="M0 0h48v48H0z"/>
  </Svg>
)

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { login, darkMode } = useTaskContext()
  const C = darkMode ? COLORS.dark : COLORS.light

  const [showForm, setShowForm] = useState(false)
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')

  const handleGooglePress = () => {
    // To enable real Google OAuth, install expo-auth-session and configure:
    // 1. expo install expo-auth-session expo-web-browser
    // 2. Add your Google client IDs from console.cloud.google.com
    // 3. Replace this mock with: Google.useAuthRequest({ clientId: '...' })
    setShowForm(true)
  }

  const handleConfirm = () => {
    if (!name.trim()) return
    login({
      name:  name.trim(),
      email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      photo: null,
    })
    setShowForm(false)
  }

  const handleGuest = () => {
    login({ name: 'Guest', email: '', photo: null })
  }

  return (
    <View style={[styles.container, { backgroundColor: C.bgApp }]}>

      {/* Top decorative blob */}
      <View style={[styles.blob, { backgroundColor: C.amberLight, top: -60, left: -80 }]} />
      <View style={[styles.blob, { backgroundColor: C.amberLight, top: 100, right: -100, width: 280, height: 280 }]} />

      {/* Logo + headline */}
      <View style={[styles.hero, { paddingTop: insets.top + 60 }]}>
        <View style={[styles.logoCircle, { backgroundColor: C.amber }]}>
          <Text style={styles.logoLetter}>D</Text>
        </View>
        <Text style={[styles.appName, { color: C.inkPrimary }]}>Daylog</Text>
        <Text style={[styles.tagline, { color: C.inkMuted }]}>
          Track your time,{'\n'}one task at a time.
        </Text>
      </View>

      {/* Sign-in card */}
      <View style={[styles.card, { backgroundColor: C.bgPanel }]}>
        <Text style={[styles.cardTitle, { color: C.inkPrimary }]}>Get started</Text>
        <Text style={[styles.cardSubtitle, { color: C.inkMuted }]}>
          Sign in to sync your tasks and preferences
        </Text>

        {/* Google button */}
        <TouchableOpacity
          style={[styles.googleBtn, { borderColor: C.border }]}
          onPress={handleGooglePress}
          activeOpacity={0.85}
        >
          <GoogleG size={20} />
          <Text style={[styles.googleBtnText, { color: C.inkPrimary }]}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
          <Text style={[styles.dividerText, { color: C.inkFaint }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
        </View>

        {/* Guest */}
        <TouchableOpacity
          style={[styles.guestBtn, { backgroundColor: C.bgInput, borderColor: C.border }]}
          onPress={handleGuest}
          activeOpacity={0.75}
        >
          <Text style={[styles.guestBtnText, { color: C.inkMuted }]}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>

      {/* Name/email form modal (mock Google OAuth) */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowForm(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ justifyContent: 'flex-end' }}
        >
          <View style={[styles.formSheet, { backgroundColor: C.bgPanel, paddingBottom: insets.bottom + 24 }]}>
            <View style={[styles.handle, { backgroundColor: C.border }]} />

            {/* Google icon */}
            <View style={styles.formHeader}>
              <GoogleG size={28} />
              <Text style={[styles.formTitle, { color: C.inkPrimary }]}>Sign in with Google</Text>
            </View>
            <Text style={[styles.formSubtitle, { color: C.inkMuted }]}>
              Enter your Google account details
            </Text>

            <View style={[styles.inputWrap, { borderColor: C.border, backgroundColor: C.bgInput }]}>
              <TextInput
                style={[styles.input, { color: C.inkPrimary }]}
                placeholder="Your name"
                placeholderTextColor={C.inkMuted}
                value={name}
                onChangeText={setName}
                autoFocus
                selectionColor={C.amber}
              />
            </View>
            <View style={[styles.inputWrap, { borderColor: C.border, backgroundColor: C.bgInput }]}>
              <TextInput
                style={[styles.input, { color: C.inkPrimary }]}
                placeholder="Email address (optional)"
                placeholderTextColor={C.inkMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                selectionColor={C.amber}
              />
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: name.trim() ? '#4285F4' : C.bgInput }]}
              onPress={handleConfirm}
              disabled={!name.trim()}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmBtnText, { color: name.trim() ? '#FFFFFF' : C.inkMuted }]}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:           1,
    justifyContent: 'flex-end',
    overflow:       'hidden',
  },
  blob: {
    position:     'absolute',
    width:        320,
    height:       320,
    borderRadius: 160,
    opacity:      0.6,
  },
  hero: {
    flex:       1,
    alignItems: 'center',
    justifyContent: 'center',
    gap:        16,
    paddingHorizontal: 32,
  },
  logoCircle: {
    width:          80,
    height:         80,
    borderRadius:   40,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    '#7C5CFC',
    shadowOffset:   { width: 0, height: 8 },
    shadowOpacity:  0.3,
    shadowRadius:   20,
    elevation:      10,
  },
  logoLetter: {
    color:      '#FFFFFF',
    fontSize:   40,
    fontWeight: '800',
    lineHeight: 48,
  },
  appName: {
    fontSize:   36,
    fontWeight: '800',
  },
  tagline: {
    fontSize:  16,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    borderTopLeftRadius:  32,
    borderTopRightRadius: 32,
    padding:              28,
    paddingBottom:        40,
    shadowColor:          '#000',
    shadowOffset:         { width: 0, height: -4 },
    shadowOpacity:        0.08,
    shadowRadius:         16,
    elevation:            8,
  },
  cardTitle: {
    fontSize:     24,
    fontWeight:   '800',
    marginBottom:  6,
  },
  cardSubtitle: {
    fontSize:     14,
    marginBottom: 24,
    lineHeight:   20,
  },
  googleBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              12,
    paddingVertical:  16,
    borderRadius:     14,
    borderWidth:      1.5,
    backgroundColor:  '#FFFFFF',
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: 2 },
    shadowOpacity:    0.06,
    shadowRadius:     8,
    elevation:        2,
  },
  googleBtnText: {
    fontSize:   15,
    fontWeight: '700',
  },
  divider: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             12,
    marginVertical: 16,
  },
  dividerLine: {
    flex:   1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
  },
  guestBtn: {
    paddingVertical: 16,
    borderRadius:    14,
    borderWidth:     1.5,
    alignItems:      'center',
  },
  guestBtnText: {
    fontSize:   15,
    fontWeight: '600',
  },
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  formSheet: {
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    paddingHorizontal:    24,
    paddingTop:           12,
  },
  handle: {
    width:        44,
    height:       4,
    borderRadius: 2,
    alignSelf:    'center',
    marginBottom: 24,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    marginBottom:   8,
  },
  formTitle: {
    fontSize:   20,
    fontWeight: '800',
  },
  formSubtitle: {
    fontSize:     13,
    marginBottom: 20,
  },
  inputWrap: {
    borderWidth:   1.5,
    borderRadius:  14,
    marginBottom:  12,
    overflow:      'hidden',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical:   14,
    fontSize:          16,
  },
  confirmBtn: {
    borderRadius:    14,
    paddingVertical: 16,
    alignItems:      'center',
    marginTop:       4,
  },
  confirmBtnText: {
    fontSize:   15,
    fontWeight: '800',
  },
})
