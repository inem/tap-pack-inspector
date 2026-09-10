"""Reveal a pack-declared output directory inside the active TAP profile."""
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import sys


def resolve_folder(profile_root, value):
    if not isinstance(value, str) or not 1 <= len(value) <= 240:
        raise ValueError('invalid_folder')
    relative = PurePosixPath(value)
    if (relative.is_absolute() or '..' in relative.parts or str(relative) != value
            or '\\' in value or '\x00' in value or not relative.parts
            or relative.parts[0] != 'data'):
        raise ValueError('invalid_folder')
    data = (Path(profile_root).resolve() / 'data').resolve()
    target = (Path(profile_root).resolve() / relative).resolve()
    if target != data and data not in target.parents:
        raise ValueError('invalid_folder')
    if not target.is_dir():
        raise FileNotFoundError('folder_missing')
    return target


def main():
    context = json.loads(os.environ['TAP_PACK_CONTEXT'])
    request = json.loads(sys.stdin.readline())
    args = request.get('args')
    try:
        if not isinstance(args, dict) or args.get('action') != 'reveal_folder':
            raise ValueError('unsupported_action')
        target = resolve_folder(context['profile_root'], args.get('path'))
        subprocess.run(['/usr/bin/open', str(target)], check=True, timeout=4)
        result = {'ok': True, 'value': {'path': str(target)}}
    except (ValueError, FileNotFoundError) as error:
        code = str(error)
        result = {'ok': False, 'error': {'code': code, 'message': code.replace('_', ' ')}}
    print(json.dumps(result, separators=(',', ':')))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(json.dumps({'error': type(error).__name__}), file=sys.stderr)
        raise
