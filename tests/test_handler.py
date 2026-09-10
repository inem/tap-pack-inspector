import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from handler import resolve_folder


class FolderTests(unittest.TestCase):
    def test_accepts_existing_profile_data_folder(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary) / 'data/readers/example'
            folder.mkdir(parents=True)
            self.assertEqual(resolve_folder(temporary, 'data/readers/example'), folder.resolve())

    def test_rejects_escape_and_non_data_paths(self):
        with tempfile.TemporaryDirectory() as temporary:
            for value in ('../outside', '/tmp/outside', 'state/readers/example', 'data/../state'):
                with self.subTest(value=value), self.assertRaises(ValueError):
                    resolve_folder(temporary, value)


if __name__ == '__main__':
    unittest.main()
