import parseCSV from 'csv-parse';
import path from 'path';
import fs from 'fs';

import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  filename: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const lines = parseCSV({ from_line: 2 });

    const filePath = path.join(uploadConfig.directory, filename);
    const readStream = fs.createReadStream(filePath);

    const parsedCSV = readStream.pipe(lines);

    const transactions: Transaction[] = [];
    const createTransaction = new CreateTransactionService();

    parsedCSV.on('data', async line => {
      const [title, type, value, category] = line;

      const transaction = await createTransaction.execute({
        title,
        type,
        value,
        category,
      });

      transactions.push(transaction);
    });

    await new Promise(resolve => parsedCSV.on('end', resolve));

    return transactions;
  }
}

export default ImportTransactionsService;
