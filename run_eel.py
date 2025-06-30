'''
(C) 2025 James Skelley
GNU AFFERO GENERAL PUBLIC LICENSE (with disclaimer addition)

See top-level LICENSE file for terms.

For clarity, in accordance with Item 16 of the AGPL, THE COPYRIGHT HOLDER OR ANY
OTHER PARTY WHO MODIFIES AND/OR CONVEYS THE PROGRAM AS PERMITTED ABOVE, PROVIDES
THE PROGRAM ON AN "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING, WIHTOUT LIMITATION, ANY WARRANTIES OR
CONDITIONS OF TITLE, NON-INFRINGEMENT, MERCHANTABILITY, OR FITNESS FOR A PARTICULAR
PURPOSE.  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
'''

import eel
from random import randint
import requests
import datetime
import os
import json
import db_tools
import glob

eel.init("web")

@eel.expose
def retrieve_groups():
    groups = {}
    for f in glob.glob('./repo_csvs/*.csv'):
        groups[os.path.basename(f)[:-4]] = db_tools.process_csv(f)
    #print(groups)
    return groups


eel.start("dashboard.htm", port=8080)
