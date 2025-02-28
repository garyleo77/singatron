// Example in your component:
import { Component, effect, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini-service.service';
import { SafeUrl } from '@angular/platform-browser';
import { AdMob, AdMobRewardItem, AdOptions, RewardAdPluginEvents } from '@capacitor-community/admob';
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3';

@Component({
  imports: [FormsModule],
  selector: 'fencing-gemini',
  templateUrl: './fencing-gemini.component.html',
  styleUrl: './fencing-gemini.component.css'
})
export class FencingGeminiComponent {
  userPrompt: string = '';
  generatedText: string = '';
  errorMessage: string = '';
  videoUrl: string = ''; // Store the URL of the selected video
  safeVideoUrl: SafeUrl | null = null; // Store the safe URL for the video
  isLoading = false;
  file: File | null = null;
  fileSize: number | undefined;
  userResponse = model('');
  reward = 0;
  isProdMode = false;

  constructor(private geminiService: GeminiService) {
    this.initialize();
  }

  async initialize() {
    const { status } = await AdMob.trackingAuthorizationStatus();

    if (status === 'notDetermined') {
      console.log('Display information before ads load first time.');
    } else {
      console.log('Admob Status: ', status);
    }

    await AdMob.initialize({
      'testingDevices': ['88E81EEE-836D-4D7F-9B0B-13D10D6E1088'],
      initializeForTesting: !this.isProdMode,
    });

    this.showBanner();
  }

  onFileSelected(event: any) {
    this.errorMessage = '';
    this.generatedText = '';
    this.file = event.target.files[0];
    if (!this.file) {
      return;
    }
    this.fileSize = Math.round(this.file.size / (1024 * 1024)) || undefined;

    if (this.file.type.indexOf('video') < 0) {
      this.errorMessage = "Please select a video.";
      return;
    }

    const reader = new FileReader();

    reader.onload = (e: any) => {
      this.videoUrl = e.target.result; // Store the video URL (e.g., data URL)
      this.safeVideoUrl = this.geminiService.bypassSecurity(this.videoUrl); // Bypass security
    };

    reader.readAsDataURL(this.file); // Read the file as a data URL.
  }

  async generate() {
    this.reward = 0;
    this.userPrompt = this.userResponse() || '';
    if (this.fileSize && this.fileSize > 15) {
      this.errorMessage = `Please select a video that is less than 15 MB.  
      Use a video a compression tool, e.g. 
      <a href="https://itunes.apple.com/us/app/id1536338554?mt=8">Compressor</a>, before uploading the file.`;
      return;
    }
    this.errorMessage = '';
    if (!this.videoUrl) {
      this.errorMessage = "Please select a video.";
      return;
    }
    this.isLoading = true;
    try {
      this.showRewardAd();
      const result = await this.geminiService.generateTextWithVideo(this.userPrompt, this.videoUrl);
        this.generatedText = result;
    } catch (error: any) {
      console.log('Analysis failed:', error)
      this.errorMessage =  'Analysis failed.  The server may be too busy.  Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  // async showInterstitial() {
  //   const options: AdOptions = {
  //     adId: 'Your AD ID',
  //     isTesting: !this.isProdMode,
  //     //npa: true
  //   };
  //   await AdMob.prepareInterstitial(options);
  //   await AdMob.showInterstitial();
  // }

  async showRewardAd() {
    AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      (reward: AdMobRewardItem) => {
        this.reward = 1;
      }
    );
    const options: AdOptions = {
      adId: 'ca-app-pub-9260916046880063/2779538168',
      isTesting: !this.isProdMode,
      //npa: true
    };
    try {
      await AdMob.prepareRewardVideoAd(options);
      await AdMob.showRewardVideoAd();
    } catch (error) {
      console.log('Admob reward add error', error)
      this.reward = 1;
    }
  }

  async showBanner() {
    const options: AdOptions = {
      adId: 'ca-app-pub-9260916046880063/6419400271',
      isTesting: !this.isProdMode,
      //npa: true
    };
    await AdMob.showBanner(options);
  }
}
