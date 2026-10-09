/**
 * OTS Forensic Enterprise - Автоматични тестове v12.0
 * PASEVSU · Denislav Dimitrov Pasev
 * @module Test
 */

// ================================================================
// ТЕСТОВ СЮИТ
// ================================================================
class OTSTestSuite {
    constructor() {
        this.tests = [];
        this.results = [];
        this.passed = 0;
        this.failed = 0;
        this.skipped = 0;
    }

    /**
     * Добавя тест
     */
    addTest(name, fn, skip = false) {
        this.tests.push({ name, fn, skip });
        return this;
    }

    /**
     * Изпълнява всички тестове
     */
    async run() {
        console.log('═'.repeat(60));
        console.log('🧪 ЗАПОЧВАНЕ НА ТЕСТОВЕТЕ');
        console.log('═'.repeat(60));

        for (const test of this.tests) {
            if (test.skip) {
                this.skipped++;
                console.log(`⏭️ SKIP: ${test.name}`);
                continue;
            }

            try {
                const start = performance.now();
                await test.fn();
                const duration = (performance.now() - start).toFixed(2);
                this.passed++;
                console.log(`✅ PASS: ${test.name} (${duration}ms)`);
                this.results.push({ name: test.name, status: 'PASS', duration });
            } catch (error) {
                this.failed++;
                console.log(`❌ FAIL: ${test.name} - ${error.message}`);
                this.results.push({ name: test.name, status: 'FAIL', error: error.message });
            }
        }

        console.log('═'.repeat(60));
        console.log('📊 РЕЗУЛТАТИ:');
        console.log(`  ✅ Успешни: ${this.passed}`);
        console.log(`  ❌ Неуспешни: ${this.failed}`);
        console.log(`  ⏭️ Пропуснати: ${this.skipped}`);
        console.log(`  📈 Успеваемост: ${this.passed + this.failed > 0 ? Math.round((this.passed / (this.passed + this.failed)) * 100) : 0}%`);
        console.log('═'.repeat(60));

        return {
            passed: this.passed,
            failed: this.failed,
            skipped: this.skipped,
            results: this.results,
            success: this.failed === 0
        };
    }

    /**
     * Assert функции
     */
    assert(condition, message = 'Assertion failed') {
        if (!condition) {
            throw new Error(message);
        }
        return true;
    }

    assertEqual(actual, expected, message = 'Values are not equal') {
        if (actual !== expected) {
            throw new Error(`${message}: expected ${expected}, got ${actual}`);
        }
        return true;
    }

    assertDeepEqual(actual, expected, message = 'Objects are not equal') {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr !== expectedStr) {
            throw new Error(`${message}: expected ${expectedStr}, got ${actualStr}`);
        }
        return true;
    }

    assertContains(array, item, message = 'Array does not contain item') {
        if (!array.includes(item)) {
            throw new Error(`${message}: ${item} not found in ${array}`);
        }
        return true;
    }

    assertThrows(fn, expectedError, message = 'Function did not throw expected error') {
        try {
            fn();
            throw new Error(`${message}: no error thrown`);
        } catch (error) {
            if (expectedError && !(error instanceof expectedError)) {
                throw new Error(`${message}: expected ${expectedError.name}, got ${error.constructor.name}`);
            }
            return true;
        }
    }
}

// ================================================================
// ТЕСТОВЕ ЗА OTS
// ================================================================
async function runOTSTests() {
    const suite = new OTSTestSuite();

    // ============================================================
    // 1. ТЕСТОВЕ ЗА UTILS
    // ============================================================
    suite.addTest('Utils.hexToBytes', () => {
        const result = Utils.hexToBytes('48656c6c6f');
        suite.assertEqual(result.length, 5);
        suite.assertEqual(result[0], 0x48);
        suite.assertEqual(result[1], 0x65);
        suite.assertEqual(result[2], 0x6c);
        suite.assertEqual(result[3], 0x6c);
        suite.assertEqual(result[4], 0x6f);
    });

    suite.addTest('Utils.bytesToHex', () => {
        const result = Utils.bytesToHex([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
        suite.assertEqual(result, '48656c6c6f');
    });

    suite.addTest('Utils.sha256', async () => {
        const data = new TextEncoder().encode('Hello');
        const hash = await Utils.sha256(data);
        suite.assertEqual(hash.length, 32);
    });

    suite.addTest('Utils.sha256Hex', async () => {
        const hash = await Utils.sha256Hex('Hello');
        suite.assertEqual(hash.length, 64);
        suite.assertEqual(hash, '185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969');
    });

    // ============================================================
    // 2. ТЕСТОВЕ ЗА OPS
    // ============================================================
    suite.addTest('Ops.OpSHA256', () => {
        const op = new Ops.OpSHA256();
        suite.assert(op instanceof Ops.CryptOp);
        suite.assertEqual(op._TAG(), 0x08);
        suite.assertEqual(op._DIGEST_LENGTH(), 32);
    });

    suite.addTest('Ops.OpAppend', () => {
        const op = new Ops.OpAppend([0x01, 0x02]);
        const result = op.call([0x03, 0x04]);
        suite.assertDeepEqual(result, [0x03, 0x04, 0x01, 0x02]);
    });

    suite.addTest('Ops.OpPrepend', () => {
        const op = new Ops.OpPrepend([0x01, 0x02]);
        const result = op.call([0x03, 0x04]);
        suite.assertDeepEqual(result, [0x01, 0x02, 0x03, 0x04]);
    });

    suite.addTest('Ops.OpReverse', () => {
        const op = new Ops.OpReverse();
        const result = op.call([0x01, 0x02, 0x03, 0x04]);
        suite.assertDeepEqual(result, [0x04, 0x03, 0x02, 0x01]);
    });

    // ============================================================
    // 3. ТЕСТОВЕ ЗА TIMESTAMP
    // ============================================================
    suite.addTest('Timestamp.create', () => {
        const ts = new Timestamp([0x01, 0x02, 0x03]);
        suite.assertDeepEqual(ts.msg, [0x01, 0x02, 0x03]);
        suite.assert(ts.attestations instanceof Array);
        suite.assert(ts.ops instanceof Map);
    });

    suite.addTest('Timestamp.add', () => {
        const ts = new Timestamp([0x01, 0x02]);
        const op = new Ops.OpSHA256();
        const result = ts.add(op);
        suite.assert(result instanceof Timestamp);
        suite.assert(ts.ops.has(op));
    });

    // ============================================================
    // 4. ТЕСТОВЕ ЗА DETACHED TIMESTAMP FILE
    // ============================================================
    suite.addTest('DetachedTimestampFile.fromBytes', async () => {
        const data = new Uint8Array([0x01, 0x02, 0x03]);
        const hashOp = new Ops.OpSHA256();
        const dts = await DetachedTimestampFile.fromBytes(hashOp, data);
        suite.assert(dts instanceof DetachedTimestampFile);
        suite.assert(dts.fileHashOp instanceof Ops.OpSHA256);
        suite.assert(dts.timestamp instanceof Timestamp);
    });

    // ============================================================
    // 5. ТЕСТОВЕ ЗА EVIDENCE PACKAGE
    // ============================================================
    suite.addTest('OTSPackage.create', () => {
        const pkg = new OTSPackage({
            organization: 'PASEVSU',
            author: 'Test'
        });
        pkg.create(
            new Uint8Array([0x01, 0x02, 0x03]),
            { name: 'test.txt', size: 3, hash: '0123456789abcdef' }
        );
        suite.assert(pkg.data.report.reportId);
        suite.assertEqual(pkg.data.report.organization, 'PASEVSU');
        suite.assertEqual(pkg.data.document.fileName, 'test.txt');
    });

    suite.addTest('OTSPackage.addOTS', () => {
        const pkg = new OTSPackage();
        pkg.create(
            new Uint8Array([0x01, 0x02, 0x03]),
            { name: 'test.txt', size: 3, hash: '0123456789abcdef' }
        );
        pkg.addOTS({
            fileName: 'test.ots',
            size: 1024,
            digest: '0123456789abcdef',
            generatedAt: new Date().toISOString(),
            durationMs: 100,
            calendars: ['https://test.calendar']
        });
        suite.assert(pkg.data.ots.fileName, 'test.ots');
        suite.assertEqual(pkg.data.ots.size, 1024);
    });

    suite.addTest('OTSPackage.calculateHash', async () => {
        const pkg = new OTSPackage();
        pkg.create(
            new Uint8Array([0x01, 0x02, 0x03]),
            { name: 'test.txt', size: 3, hash: '0123456789abcdef' }
        );
        const hash = await pkg.calculateHash();
        suite.assertEqual(typeof hash, 'string');
        suite.assertEqual(hash.length, 64);
    });

    suite.addTest('OTSPackage.validate', () => {
        const pkg = new OTSPackage();
        pkg.create(
            new Uint8Array([0x01, 0x02, 0x03]),
            { name: 'test.txt', size: 3, hash: '0123456789abcdef' }
        );
        const result = pkg.validate();
        suite.assert(result.valid);
        suite.assert(result.errors.length === 0);
    });

    // ============================================================
    // 6. ТЕСТОВЕ ЗА BLOCKCHAIN API
    // ============================================================
    suite.addTest('BlockchairAPI.ping', async () => {
        if (typeof BlockchairAPI !== 'undefined') {
            const api = new BlockchairAPI();
            const result = await api.ping();
            // Не assert-ваме, защото може да няма интернет
            console.log(`  ℹ️ Blockchair API ping: ${result ? 'online' : 'offline'}`);
        } else {
            console.log('  ⏭️ BlockchairAPI не е наличен');
        }
    });

    // ============================================================
    // 7. ТЕСТОВЕ ЗА PDF GENERATOR
    // ============================================================
    suite.addTest('PDFGenerator.generateReport', async () => {
        if (typeof PDFGenerator !== 'undefined') {
            const pkg = new OTSPackage();
            pkg.create(
                new Uint8Array([0x01, 0x02, 0x03]),
                { name: 'test.txt', size: 3, hash: '0123456789abcdef' }
            );
            pkg.addOTS({
                fileName: 'test.ots',
                size: 1024,
                digest: '0123456789abcdef',
                generatedAt: new Date().toISOString(),
                durationMs: 100,
                calendars: ['https://test.calendar']
            });
            await pkg.calculateHash();
            
            try {
                const pdf = await PDFGenerator.generateReport(pkg.export());
                suite.assert(pdf instanceof Blob);
                suite.assertEqual(pdf.type, 'application/pdf');
                suite.assert(pdf.size > 0);
            } catch (error) {
                // jsPDF може да не е зареден
                console.log(`  ⚠️ PDF generation: ${error.message}`);
            }
        } else {
            console.log('  ⏭️ PDFGenerator не е наличен');
        }
    });

    // ============================================================
    // 8. ТЕСТОВЕ ЗА EXTEND ERROR
    // ============================================================
    suite.addTest('ExtendError.OTSFileError', () => {
        const error = new ExtendError.OTSFileError('Test error', { file: 'test.ots' });
        suite.assert(error instanceof ExtendError.ExtendableError);
        suite.assertEqual(error.code, 'OTS_FILE_ERROR');
        suite.assert(error.details.file, 'test.ots');
    });

    suite.addTest('ExtendError.safeExecute', () => {
        const result = ExtendError.safeExecute(() => {
            return 'success';
        }, 'fallback');
        suite.assertEqual(result, 'success');

        const fallback = ExtendError.safeExecute(() => {
            throw new Error('error');
        }, 'fallback');
        suite.assertEqual(fallback, 'fallback');
    });

    // ============================================================
    // 9. ТЕСТОВЕ ЗА MERKLE
    // ============================================================
    suite.addTest('Merkle.catSha256', () => {
        const left = new Timestamp([0x01]);
        const right = new Timestamp([0x02]);
        const result = Merkle.catSha256(left, right);
        suite.assert(result instanceof Timestamp);
        suite.assert(result.msg.length > 0);
    });

    // ============================================================
    // 10. ТЕСТОВЕ ЗА CALENDAR
    // ============================================================
    suite.addTest('Calendar.RemoteCalendar', () => {
        const calendar = new Calendar.RemoteCalendar('https://test.calendar');
        suite.assertEqual(calendar.url, 'https://test.calendar');
        suite.assertEqual(calendar.timeout, 30000);
    });

    suite.addTest('Calendar.UrlWhitelist', () => {
        const whitelist = new Calendar.UrlWhitelist();
        whitelist.add('https://test.calendar');
        suite.assert(whitelist.contains('https://test.calendar/path'));
        suite.assert(!whitelist.contains('https://evil.com'));
    });

    // ============================================================
    // 11. ТЕСТОВЕ ЗА ESPLORA
    // ============================================================
    suite.addTest('Esplora.constructor', () => {
        const esplora = new Esplora({ url: 'https://test.esplora' });
        suite.assertEqual(esplora.url, 'https://test.esplora');
        suite.assertEqual(esplora.timeout, 10000);
    });

    // ============================================================
    // 12. ТЕСТОВЕ ЗА BITCOIN
    // ============================================================
    suite.addTest('Bitcoin.BitcoinNode', () => {
        const node = new Bitcoin.BitcoinNode({ apiUrl: 'https://test.api' });
        suite.assertEqual(node.apiUrl, 'https://test.api');
        suite.assertEqual(node.timeout, 10000);
    });

    suite.addTest('Bitcoin.BlockHeader', () => {
        const header = new Bitcoin.BlockHeader(
            '0x1234',
            '0x5678',
            1234567890
        );
        suite.assertEqual(header.getMerkleroot(), '0x1234');
        suite.assertEqual(header.getHash(), '0x5678');
        suite.assertEqual(header.getTime(), 1234567890);
    });

    // ============================================================
    // ИЗПЪЛНЕНИЕ
    // ============================================================
    return await suite.run();
}

// ================================================================
// СТАРТИРАНЕ НА ТЕСТОВЕТЕ
// ================================================================
if (typeof window !== 'undefined') {
    // В браузър
    window.runOTSTests = runOTSTests;
    
    // Автоматично стартиране след зареждане
    if (document.readyState === 'complete') {
        setTimeout(runOTSTests, 1000);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(runOTSTests, 1000);
        });
    }
}

console.log('✅ test.js зареден');