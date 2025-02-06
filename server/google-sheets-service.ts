import { google } from 'googleapis';
import { Lead } from '@shared/schema';

export class GoogleSheetsService {
  private sheets;
  private spreadsheetId: string | null = null;

  constructor(credentials: any) {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async initializeSpreadsheet(title: string = 'Business Auto-Responder Leads') {
    try {
      // Create a new spreadsheet
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: { title },
          sheets: [{
            properties: {
              title: 'Leads',
              gridProperties: {
                frozenRowCount: 1
              }
            }
          }]
        }
      });

      this.spreadsheetId = response.data.spreadsheetId;

      // Set up headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Leads!A1:F1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'ID',
            'Name',
            'Phone Number',
            'Source',
            'Notes',
            'Created At'
          ]]
        }
      });

      return this.spreadsheetId;
    } catch (error) {
      console.error('Error initializing spreadsheet:', error);
      throw error;
    }
  }

  async addLead(lead: Lead) {
    if (!this.spreadsheetId) {
      throw new Error('Spreadsheet not initialized');
    }

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Leads!A:F',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            lead.id,
            lead.name,
            lead.phoneNumber,
            lead.source,
            lead.notes,
            new Date(lead.createdAt).toISOString()
          ]]
        }
      });
    } catch (error) {
      console.error('Error adding lead to spreadsheet:', error);
      throw error;
    }
  }

  async syncLeads(leads: Lead[]) {
    if (!this.spreadsheetId) {
      throw new Error('Spreadsheet not initialized');
    }

    try {
      // Clear existing data (except headers)
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'Leads!A2:F'
      });

      // Add all leads
      const values = leads.map(lead => [
        lead.id,
        lead.name,
        lead.phoneNumber,
        lead.source,
        lead.notes,
        new Date(lead.createdAt).toISOString()
      ]);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Leads!A2:F',
        valueInputOption: 'RAW',
        requestBody: { values }
      });
    } catch (error) {
      console.error('Error syncing leads to spreadsheet:', error);
      throw error;
    }
  }
}

let sheetsService: GoogleSheetsService | null = null;

export function initGoogleSheetsService(credentials: any) {
  sheetsService = new GoogleSheetsService(credentials);
  return sheetsService;
}

export function getGoogleSheetsService() {
  if (!sheetsService) {
    throw new Error('Google Sheets service not initialized');
  }
  return sheetsService;
}
