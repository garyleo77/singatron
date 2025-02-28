import { Component } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'; // For video embeddingimport { Injectable } from '@angular/core';
import { S3Client, PutObjectCommand, CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3';
import { Upload } from "@aws-sdk/lib-storage";

@Component({
  selector: 'app-fencing-gemini',
  imports: [],
  templateUrl: './fencing-gemini.component.html',
  styleUrl: './fencing-gemini.component.css'
})
export class FencingGeminiComponent {

}

interface GeminiRequest {
  model: string;
  prompt: {
    text: string;
  };
  video: { // Assuming a way to represent video upload
    // ... properties for video data (e.g., base64 string, URL)
    url: string; // Or base64 string, or however your API expects it.
  };
}

interface GeminiResponse {
  candidates: {
    output: string;
  }[]; // Gemini API may return an array of candidates
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  GEMINI='AIzaSyBpDWR884WRJJeLSSzAubzKs8dEcyIQlRA'

  private apiKey = this.GEMINI || ''; // Replace with your actual API key

  constructor(private sanitizer: DomSanitizer) {
  }

  async generateTextWithVideo(prompt: string, fileUri: string): Promise<string> {
    const basePrompt = `Check if you think this video is fencing video.  If not, give an eror message, and quit.
        If it is an epee fencing video, describe this epee fencing video. 
        If there are multiple fencers on the video, look at the fencers closest to the center of the video and closest to the camera.
        Describe the actions of the fencers.
        State which fencer you think lost?  Give a distinction of which fencer is which, e.g. short versus tall fencer, or the color of their shoes.  
        Note that if a green and red light flash within 0.5 seconds of each other, then it's a double touch.
        What kind of strategies can the losing fencer use next time to try and win?
        Use fencing terms to describe the strategy if possible, like 'lunge' or 'fleche' or 'parry' or 'riposte'. ` + prompt;

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `
        Assume the video is not upside down.
        Answer like you are a funny but sometimes serious 60 year old Ukranian olympic coach speaking mostly good English.
        Send a very detailed response as nicely formatted HTML with bullet points (at least 5 per fencer).
        Do not include the starting and ending html tags nor body tags in your response.  The first sentence should start with an <h4> tag.
        `,
      generationConfig: {
        temperature: 0
      }
    });

    const videoPart = {
      inlineData: {
        mimeType: 'video/mp4',
        data: fileUri.split(',')[1]
      },
    };
    const result = await model.generateContent([basePrompt, videoPart]);
    return this.omitFirstLine(result.response.text());
  }
  // Helper function to bypass security for video URLs (use with caution!)

  bypassSecurity(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  omitFirstLine(str: string) {
    // Find the index of the first newline character
    let targetDelimiter = str.indexOf("<h4>");
    if (targetDelimiter < 0) {
      targetDelimiter = 0;
    }

    // If a newline character is found, extract the substring after it
    return str.substring(targetDelimiter).replaceAll('`', '');
  }
}
