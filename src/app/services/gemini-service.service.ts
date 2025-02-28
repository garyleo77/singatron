import { Component } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'; // For audio embeddingimport { Injectable } from '@angular/core';
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
  audio: { // Assuming a way to represent audio upload
    // ... properties for audio data (e.g., base64 string, URL)
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
    const basePrompt = `Check if you think this audio recording is of someone singing.  If not, give an eror message, and quit.
        If it is, give the name and artist that wrote the song, and say if the person's recording is good singing.  
        If not, rate the singer from 1 to 10 (1 being worst), and say how they can improve.` + prompt;

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `
        Answer like you are a mean and strict judge from a singing competition show, like Simon Cowell.
        Send a very detailed response as nicely formatted HTML with bullet points (at least 5).
        Do not include the starting and ending html tags nor body tags in your response.  The first sentence should start with an <h4> tag.
        `,
      generationConfig: {
        temperature: 0
      }
    });

    const videoPart = {
      inlineData: {
        mimeType: 'audio/mp4',
        data: fileUri.split(',')[1]
      },
    };
    const result = await model.generateContent([basePrompt, videoPart]);
    return this.omitFirstLine(result.response.text());
  }
  // Helper function to bypass security for audio URLs (use with caution!)

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
