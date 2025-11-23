#!/usr/bin/env bun

/**
 * Script to clear all posts from the database
 *
 * Usage:
 *   bun run scripts/clear-posts.ts --remote --confirm
 *   bun run scripts/clear-posts.ts --local --confirm
 *   bun run scripts/clear-posts.ts --remote --dry-run  (to see what would be deleted)
 */

// Make this a module for TypeScript
export {};

// Bun types are available at runtime
declare const Bun: {
  spawn: (args: string[], options: { stdout: 'pipe'; stderr: 'pipe' }) => {
    stdout: ReadableStream;
    stderr: ReadableStream;
    exitCode: number | null;
  };
};

const args = process.argv.slice(2);
const isRemote = args.includes('--remote');
const isLocal = args.includes('--local');
const isDryRun = args.includes('--dry-run');
const isConfirmed = args.includes('--confirm');

if (!isRemote && !isLocal) {
  console.error('❌ Error: Must specify --remote or --local');
  console.log('\nUsage:');
  console.log('  bun run scripts/clear-posts.ts --remote --confirm');
  console.log('  bun run scripts/clear-posts.ts --local --confirm');
  console.log('  bun run scripts/clear-posts.ts --remote --dry-run');
  process.exit(1);
}

if (!isDryRun && !isConfirmed) {
  console.error('❌ Error: Must specify --confirm to proceed or --dry-run to preview');
  console.log('\nUsage:');
  console.log('  bun run scripts/clear-posts.ts --remote --confirm');
  console.log('  bun run scripts/clear-posts.ts --remote --dry-run');
  process.exit(1);
}

const dbType = isRemote ? 'REMOTE' : 'LOCAL';
const wranglerArgs = isRemote ? '--remote' : '--local';

console.log(`\n⚠️  WARNING: This will DELETE ALL POSTS from the ${dbType} database!`);
console.log(`Database: journal-db`);
console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (posts will be deleted)'}\n`);

// First, get the count of posts
const countResult = Bun.spawn([
  'wrangler',
  'd1',
  'execute',
  'journal-db',
  wranglerArgs,
  '--command',
  'SELECT COUNT(*) as count FROM posts;'
], {
  stdout: 'pipe',
  stderr: 'pipe'
});

const countOutput = await new Response(countResult.stdout).text();
const countMatch = countOutput.match(/"count":\s*(\d+)/);

if (!countMatch) {
  console.error('❌ Error: Could not get post count');
  const errorOutput = await new Response(countResult.stderr).text();
  console.error(errorOutput);
  process.exit(1);
}

const postCount = parseInt(countMatch[1], 10);

if (postCount === 0) {
  console.log('✅ No posts found in the database. Nothing to delete.');
  process.exit(0);
}

console.log(`📊 Found ${postCount} post(s) in the database.\n`);

if (isDryRun) {
  console.log('🔍 DRY RUN: Would delete the following:\n');

  if (postCount > 0) {
    console.log(`📝 Posts (${postCount}):`);
    // Show the posts that would be deleted
    const listResult = Bun.spawn([
      'wrangler',
      'd1',
      'execute',
      'journal-db',
      wranglerArgs,
      '--command',
      'SELECT id, title, created_at FROM posts ORDER BY created_at DESC LIMIT 10;'
    ], {
      stdout: 'pipe',
      stderr: 'pipe'
    });

    const listOutput = await new Response(listResult.stdout).text();
    console.log(listOutput);

    if (postCount > 10) {
      console.log(`\n... and ${postCount - 10} more post(s)`);
    }
    console.log();
  }

  console.log('\n💡 To actually delete, run:');
  console.log(`   bun run scripts/clear-posts.ts ${wranglerArgs} --confirm`);
  process.exit(0);
}

// Confirmed deletion
if (postCount > 0) {
  console.log('🗑️  Deleting all posts from database...\n');

  const deleteResult = Bun.spawn([
    'wrangler',
    'd1',
    'execute',
    'journal-db',
    wranglerArgs,
    '--command',
    'DELETE FROM posts;'
  ], {
    stdout: 'pipe',
    stderr: 'pipe'
  });

  const deleteOutput = await new Response(deleteResult.stdout).text();
  const deleteError = await new Response(deleteResult.stderr).text();

  // Check for success indicators in output
  const hasSuccess = deleteOutput.includes('"success": true') ||
                     deleteOutput.includes('Executed') ||
                     deleteOutput.includes('changes');

  // Check for errors
  const hasError = deleteError.trim().length > 0 ||
                   (deleteOutput.toLowerCase().includes('error') && !hasSuccess) ||
                   (deleteOutput.toLowerCase().includes('failed') && !hasSuccess);

  // Check exit code (may be null if process hasn't finished)
  const exitCode = deleteResult.exitCode;

  if (hasError || (exitCode !== null && exitCode !== 0)) {
    console.error('❌ Error deleting posts:');
    if (deleteError.trim()) {
      console.error(deleteError);
    }
    if (deleteOutput.trim() && !hasSuccess) {
      console.error('Output:', deleteOutput);
    }
    if (exitCode !== null && exitCode !== 0) {
      console.error('Exit code:', exitCode);
    }
    process.exit(1);
  } else if (!hasSuccess && exitCode === null) {
    // If we can't determine success and exit code is null, wait and check again
    await new Promise(resolve => setTimeout(resolve, 500));
    const finalExitCode = deleteResult.exitCode;
    if (finalExitCode !== null && finalExitCode !== 0) {
      console.error('❌ Error deleting posts (exit code:', finalExitCode, ')');
      if (deleteError.trim()) {
        console.error(deleteError);
      }
      process.exit(1);
    }
  }

  // If we got here, assume success (will be verified next)

  // Verify deletion
  const verifyResult = Bun.spawn([
    'wrangler',
    'd1',
    'execute',
    'journal-db',
    wranglerArgs,
    '--command',
    'SELECT COUNT(*) as count FROM posts;'
  ], {
    stdout: 'pipe',
    stderr: 'pipe'
  });

  const verifyOutput = await new Response(verifyResult.stdout).text();
  const verifyMatch = verifyOutput.match(/"count":\s*(\d+)/);

  if (verifyMatch && parseInt(verifyMatch[1], 10) === 0) {
    console.log(`✅ Successfully deleted ${postCount} post(s) from ${dbType} database.`);
  } else {
    console.log('⚠️  Deletion completed, but verification shows posts may still exist.');
    console.log('Verify output:', verifyOutput);
  }
}

console.log('\n✨ Cleanup complete!');
console.log('💡 Note: R2 objects are not deleted by this script.');
console.log('   Delete them manually from the Cloudflare dashboard if needed.');
