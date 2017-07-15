
import React from 'react';
import { connect } from 'react-redux'
import { ScrollView, StyleSheet, Image, Text, View, Alert, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Expo, { Constants } from 'expo';
import { Models } from '../dataStorage/models';
import { clearStorageAsync, callWebServiceAsync, showWebServiceCallErrorsAsync } from '../dataStorage/storage';
import { getCurrentUser } from '../store/user';
import { requestBooks } from "../store/books.js";
import { FontAwesome } from '@expo/vector-icons';
import SettingsList from 'react-native-settings-list';
import getI18nText from '../store/I18n';
import { clearLesson } from '../store/lessons.js'
import { clearPassage } from '../store/passage.js'
import { RkConfig, RkCard, RkButton, RkChoiceGroup, RkChoice, RkText, RkTabView } from 'react-native-ui-kitten';
import {
  ActionSheetProvider,
  connectActionSheet,
} from '@expo/react-native-action-sheet';

class SettingsScreen extends React.Component {
  render() {
    return (
      <ActionSheetProvider>
        <SettingsScreenUI />
      </ActionSheetProvider>
    );
  }
}
@connectActionSheet class SettingsScreenUI extends React.Component {
  static route = {
    navigationBar: {
      title(params) {
        return getI18nText('我');
      }
    },
  };

  state = {
    language: getCurrentUser().getLanguageDisplayName(),
    bibleVersion: getCurrentUser().getBibleVersionDisplayName()
  };

  async onLanguageChange(language) {
    if (getCurrentUser().getLanguage() != language) {
      await getCurrentUser().setLanguageAsync(language);

      // Also set the bible version based on language selection
      if (language == 'eng' || language == 'spa') {
        await this.onBibleVerseChange('niv2011');
      } else if (language == 'cht') {
        await this.onBibleVerseChange('rcuvts');
      } else {
        await this.onBibleVerseChange('rcuvss');
      }

      Expo.Util.reload();

      // FIXME: [Wei] For some reason "reload" doesn't work on iOS
      this.props.clearLesson();
      this.props.requestBooks(language);
      this.setState({ language: getCurrentUser().getLanguageDisplayName() });
    }
  }

  async onBibleVerseChange(version) {
    if (getCurrentUser().getBibleVersion() != version) {
      await getCurrentUser().setBibleVersionAsync(version);
      Expo.Util.reload();

      // FIXME: [Wei] For some reason "reload" doesn't work on iOS
      this.props.clearPassage();
      this.setState({ bibleVersion: getCurrentUser().getBibleVersionDisplayName() });
    }
  }

  feedback = '';

  onLanguage() {
    let options = [];
    for (var i in Models.Languages) {
      const text = Models.Languages[i].DisplayName;
      console.log(text);
      options.push(text);
    }
    options.push('Cancel');
    let cancelButtonIndex = options.length - 1;
    let destructiveButtonIndex = cancelButtonIndex;
    this.props.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      buttonIndex => {
        if (buttonIndex != cancelButtonIndex) {
          this.onLanguageChange(Models.Languages[buttonIndex].Value);
        }
      }
    );
  }

  onBibleVerse() {
    let options = [];
    for (var i in Models.BibleVersions) {
      const text = Models.BibleVersions[i].DisplayName;
      options.push(text);
    }
    options.push('Cancel');
    let cancelButtonIndex = options.length - 1;
    let destructiveButtonIndex = cancelButtonIndex;
    this.props.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      buttonIndex => {
        if (buttonIndex != cancelButtonIndex) {
          this.onBibleVerseChange(Models.BibleVersions[buttonIndex].Value);
        }
      }
    );
  }

  onFontSize() {
    alert("TODO: onFontSize");
  }

  async onSubmitFeedback() {
    if (this.feedback.trim() == '') {
      Alert.alert(getI18nText('缺少内容'), getI18nText('请输入反馈意见内容'), [
        { text: 'OK', onPress: () => this.feedbackInput.focus() },
      ]);
      return;
    }

    const body = { comment: this.feedback };
    const result = await callWebServiceAsync(Models.Feedback.restUri, '', 'POST', [], body);
    const succeed = await showWebServiceCallErrorsAsync(result, 201);
    if (succeed) {
      this.feedback = '';
      Alert.alert(getI18nText('谢谢您的反馈意见！'), '', [
        { text: 'OK', onPress: () => this.feedbackInput.clear() },
      ]);
    }
  }

  render() {
    const { manifest } = Constants;
    let keyIndex = 0;
    return (
      <KeyboardAvoidingView style={styles.container} behavior='padding' keyboardVerticalOffset={0}>
        <SettingsList borderColor='#c8c7cc' defaultItemSize={40}>
          <SettingsList.Header headerText={getI18nText('设置')} headerStyle={{ color: 'black' }} />
          <SettingsList.Item
            title={getI18nText('显示语言')}
            titleInfo={this.state.language}
            titleInfoStyle={styles.titleInfoStyle}
            onPress={this.onLanguage.bind(this)}
          />
          <SettingsList.Item
            title={getI18nText('圣经版本')}
            titleInfo={this.state.bibleVersion}
            titleInfoStyle={styles.titleInfoStyle}
            onPress={this.onBibleVerse.bind(this)}
          />
          {/*<SettingsList.Item
            title='字体大小'
            titleInfo='中等'
            titleInfoStyle={styles.titleInfoStyle}
            onPress={this.onFontSize.bind(this)}
          />*/}
          <SettingsList.Header headerText={getI18nText('反馈意见')} headerStyle={{ color: 'black', marginTop: 15 }} />
          <SettingsList.Header headerText='MBSF - Mobile Bible Study Fellowship' headerStyle={{ color: 'black', marginTop: 15 }} />
          <View style={styles.answerContainer}>
            <TextInput
              style={styles.answerInput}
              ref={(input) => this.feedbackInput = input}
              blurOnSubmit={false}
              placeholder={getI18nText('反馈意见')}
              multiline
              onChangeText={(text) => { this.feedback = text }}
            />
          </View>
          <View style={{ alignItems: 'center' }}>
            <RkButton onPress={this.onSubmitFeedback.bind(this)}>{getI18nText('提交')}</RkButton>
          </View>
          <SettingsList.Item
            title={getI18nText('App版本')}
            titleInfo={manifest.version}
            hasNavArrow={false}
            titleInfoStyle={styles.titleInfoStyle}
          />
        </SettingsList>
      </KeyboardAvoidingView>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    requestBooks: () => dispatch(requestBooks()),
    clearLesson: () => dispatch(clearLesson()),
    clearPassage: () => dispatch(clearPassage())
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsScreen)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 15,
    flexDirection: 'row',
  },
  titleIconContainer: {
    marginRight: 15,
    paddingTop: 2,
  },
  sectionHeaderContainer: {
    backgroundColor: '#fbfbfb',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ededed',
  },
  sectionHeaderText: {
    fontSize: 14,
  },
  sectionContentContainer: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 15,
  },
  sectionContentText: {
    color: '#808080',
    fontSize: 14,
  },
  nameText: {
    fontWeight: '600',
    fontSize: 20,
  },
  slugText: {
    color: '#a39f9f',
    fontSize: 14,
    marginTop: -1,
    backgroundColor: 'transparent',
  },
  descriptionText: {
    fontSize: 14,
    marginTop: 6,
    color: '#4d4d4d',
  },
  colorContainer: {
    flexDirection: 'row',
  },
  colorPreview: {
    width: 17,
    height: 17,
    borderRadius: 2,
    marginRight: 6,
  },
  colorTextContainer: {
    flex: 1,
  },
  textContent: {
    fontSize: 18,
    height: 30
  },
  answerContainer: {
    marginTop: 5,
    height: 100,
    padding: 5,
    backgroundColor: 'whitesmoke',
  },
  answerInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    textAlignVertical: 'top'
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center'
  },
  buttonContainer: {
    backgroundColor: '#2980B9',
    width: 80,
    borderRadius: 4
  }
});
